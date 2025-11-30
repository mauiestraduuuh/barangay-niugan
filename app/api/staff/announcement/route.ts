import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

interface AnnouncementBody {
  id?: number;
  title?: string;
  content?: string;
  posted_by?: number;
  is_public?: boolean;
  page?: number;
  limit?: number;
}

// ================= HELPER: VERIFY TOKEN =================
function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

// ================= HELPER: ENSURE USER IS A STAFF =================
async function verifyStaffUser(userId: number) {
  const staff = await prisma.staff.findFirst({
    where: { user_id: userId },
  });
  return staff !== null;
}

// ================= HELPER: DELETE EXPIRED ANNOUNCEMENTS =================
async function deleteExpiredAnnouncements() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const result = await prisma.announcement.deleteMany({
      where: {
        posted_at: { lt: thirtyDaysAgo },
      },
    });
    console.log(`Deleted ${result.count} expired announcements`);
    return result.count;
  } catch (error) {
    console.error("Failed to delete expired announcements:", error);
    return 0;
  }
}

// GET: Fetch all announcements with pagination
export async function GET(req: NextRequest) {
  const decoded = verifyToken(req);
  if (!decoded)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (decoded.role !== "STAFF" || !(await verifyStaffUser(decoded.userId)))
    return NextResponse.json({ message: "Access denied" }, { status: 403 });

  try {
    // Delete expired announcements first
    await deleteExpiredAnnouncements();

    // Get pagination parameters from query string
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Get total count for pagination
    const total = await prisma.announcement.count({
      where: {
        posted_at: { gte: fourteenDaysAgo },
      },
    });

    // Fetch paginated announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        posted_at: { gte: fourteenDaysAgo },
      },
      orderBy: { posted_at: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      announcements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch announcements failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST: Create a new announcement
export async function POST(req: NextRequest) {
  const decoded = verifyToken(req);
  if (!decoded)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (decoded.role !== "STAFF" || !(await verifyStaffUser(decoded.userId)))
    return NextResponse.json({ message: "Access denied" }, { status: 403 });

  try {
    const { title, content, is_public }: AnnouncementBody = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use the authenticated user's ID as posted_by
    const created = await prisma.announcement.create({
      data: {
        title,
        content,
        posted_by: decoded.userId,
        is_public: is_public ?? true,
      },
    });

    return NextResponse.json({ message: "Announcement created", created });
  } catch (error) {
    console.error("Create announcement failed:", error);
    return NextResponse.json(
      { message: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing announcement
export async function PUT(req: NextRequest) {
  const decoded = verifyToken(req);
  if (!decoded)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (decoded.role !== "STAFF" || !(await verifyStaffUser(decoded.userId)))
    return NextResponse.json({ message: "Access denied" }, { status: 403 });

  try {
    const { id, title, content, is_public }: AnnouncementBody =
      await req.json();

    if (!id || !title || !content) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the announcement exists
    const existing = await prisma.announcement.findUnique({
      where: { announcement_id: id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Announcement not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.announcement.update({
      where: { announcement_id: id },
      data: { title, content, is_public },
    });

    return NextResponse.json({ message: "Announcement updated", updated });
  } catch (error) {
    console.error("Update announcement failed:", error);
    return NextResponse.json(
      { message: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an announcement
export async function DELETE(req: NextRequest) {
  const decoded = verifyToken(req);
  if (!decoded)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (decoded.role !== "STAFF" || !(await verifyStaffUser(decoded.userId)))
    return NextResponse.json({ message: "Access denied" }, { status: 403 });

  try {
    const { id }: AnnouncementBody = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Announcement ID is required" },
        { status: 400 }
      );
    }

    // Verify the announcement exists
    const existing = await prisma.announcement.findUnique({
      where: { announcement_id: id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Announcement not found" },
        { status: 404 }
      );
    }

    await prisma.announcement.delete({ where: { announcement_id: id } });

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete announcement failed:", error);
    return NextResponse.json(
      { message: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}