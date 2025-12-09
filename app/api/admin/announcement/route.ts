import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

interface AnnouncementBody {
  id?: number;
  title?: string;
  content?: string;
  posted_by?: number;
  is_public?: boolean;
  expiration_days?: number;
  page?: number;
  limit?: number;
}

// ===================== HELPER FUNCTIONS =====================

function extractExpirationDays(content: string | null): number {
  if (!content) return 14;
  const match = content.match(/\[EXP_DAYS:(\d+)\]$/);
  return match ? parseInt(match[1]) : 14;
}

function addExpirationMetadata(content: string | null, days: number): string {
  if (!content) return `[EXP_DAYS:${days}]`;
  return content.replace(/\[EXP_DAYS:\d+\]$/, '') + `[EXP_DAYS:${days}]`;
}

function cleanContent(content: string | null): string {
  if (!content) return '';
  return content.replace(/\[EXP_DAYS:\d+\]$/, '');
}

async function deleteOldAnnouncements() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  try {
    const result = await prisma.announcement.deleteMany({
      where: { posted_at: { lt: thirtyDaysAgo } },
    });
    console.log(`Deleted ${result.count} old announcements`);
    return result.count;
  } catch (err) {
    console.error("Failed to delete old announcements:", err);
    return 0;
  }
}

// ===================== AUTH HELPER =====================

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    // Fetch user role from DB to be sure
    const user = await prisma.user.findUnique({ where: { user_id: decoded.userId } });
    if (!user) return null;
    return { userId: user.user_id, role: user.role };
  } catch {
    return null;
  }
}

// ===================== GET ANNOUNCEMENTS =====================

export async function GET(req: NextRequest) {
  try {
    // Optional auth for GET, only needed if you want private announcements
    const decoded = await verifyToken(req);

    await deleteOldAnnouncements();

    const { searchParams } = new URL(req.url);
    let type = searchParams.get("type") || "active";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (type !== "active" && type !== "expired") type = "active";

    const allAnnouncements = await prisma.announcement.findMany({
      orderBy: { posted_at: "desc" },
    });

    const now = new Date();
    const filteredAnnouncements = allAnnouncements.filter(a => {
      const expirationDays = extractExpirationDays(a.content);
      const expirationDate = new Date(a.posted_at);
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      const isActive = expirationDate > now;
      if (type === "active") return isActive;
      return !isActive;
    });

    const total = filteredAnnouncements.length;
    const paginated = filteredAnnouncements.slice(skip, skip + limit);

    const announcementsWithExpiration = paginated.map(a => {
      const expirationDays = extractExpirationDays(a.content);
      const expirationDate = new Date(a.posted_at);
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      return {
        ...a,
        content: cleanContent(a.content),
        expiration_days: expirationDays,
        expiration_date: expirationDate.toISOString()
      };
    });

    return NextResponse.json({
      announcements: announcementsWithExpiration,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Fetch announcements failed:", err);
    return NextResponse.json({ message: "Failed to fetch announcements" }, { status: 500 });
  }
}

// ===================== POST ANNOUNCEMENT =====================

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || !["ADMIN", "STAFF"].includes(decoded.role)) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const { title, content, posted_by, is_public, expiration_days }: AnnouncementBody = await req.json();

    if (!title || !content || !posted_by) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const days = expiration_days && expiration_days > 0 ? expiration_days : 14;
    const contentWithMetadata = addExpirationMetadata(content, days);

    const created = await prisma.announcement.create({
      data: { 
        title, 
        content: contentWithMetadata, 
        posted_by, 
        is_public: is_public ?? true 
      },
    });

    const expirationDate = new Date(created.posted_at);
    expirationDate.setDate(expirationDate.getDate() + days);

    return NextResponse.json({
      message: "Announcement created",
      created: { ...created, content: cleanContent(created.content), expiration_days: days, expiration_date: expirationDate.toISOString() }
    });
  } catch (err) {
    console.error("Create announcement failed:", err);
    return NextResponse.json({ message: "Failed to create announcement" }, { status: 500 });
  }
}

// ===================== PUT ANNOUNCEMENT =====================

export async function PUT(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || !["ADMIN", "STAFF"].includes(decoded.role)) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const { id, title, content, is_public, expiration_days }: AnnouncementBody = await req.json();
    if (!id || !title || !content) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.announcement.findUnique({ where: { announcement_id: id } });
    if (!existing) return NextResponse.json({ message: "Announcement not found" }, { status: 404 });

    const days = expiration_days && expiration_days > 0 ? expiration_days : extractExpirationDays(existing.content);
    const contentWithMetadata = addExpirationMetadata(content, days);

    const updated = await prisma.announcement.update({
      where: { announcement_id: id },
      data: { title, content: contentWithMetadata, is_public: is_public ?? true },
    });

    const expirationDate = new Date(updated.posted_at);
    expirationDate.setDate(expirationDate.getDate() + days);

    return NextResponse.json({
      message: "Announcement updated",
      updated: { ...updated, content: cleanContent(updated.content), expiration_days: days, expiration_date: expirationDate.toISOString() }
    });
  } catch (err) {
    console.error("Update announcement failed:", err);
    return NextResponse.json({ message: "Failed to update announcement" }, { status: 500 });
  }
}

// ===================== DELETE ANNOUNCEMENT =====================

export async function DELETE(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || !["ADMIN", "STAFF"].includes(decoded.role)) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const { id }: AnnouncementBody = await req.json();
    if (!id) return NextResponse.json({ message: "Announcement ID is required" }, { status: 400 });

    await prisma.announcement.delete({ where: { announcement_id: id } });

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("Delete announcement failed:", err);
    return NextResponse.json({ message: "Failed to delete announcement" }, { status: 500 });
  }
}
