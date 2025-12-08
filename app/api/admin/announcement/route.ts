import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

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

// Helper to extract expiration days from content metadata
function extractExpirationDays(content: string | null): number {
  if (!content) return 14;
  const match = content.match(/\[EXP_DAYS:(\d+)\]$/);
  return match ? parseInt(match[1]) : 14; // default 14 days
}

// Helper to add expiration days to content
function addExpirationMetadata(content: string | null, days: number): string {
  if (!content) return `[EXP_DAYS:${days}]`;
  // Remove existing metadata if any
  const cleanContent = content.replace(/\[EXP_DAYS:\d+\]$/, '');
  return `${cleanContent}[EXP_DAYS:${days}]`;
}

// Helper to clean content for display
function cleanContent(content: string | null): string {
  if (!content) return '';
  return content.replace(/\[EXP_DAYS:\d+\]$/, '');
}

// ================= HELPER: DELETE OLD ANNOUNCEMENTS =================
async function deleteOldAnnouncements() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const result = await prisma.announcement.deleteMany({
      where: {
        posted_at: { lt: thirtyDaysAgo },
      },
    });
    console.log(`Deleted ${result.count} old announcements`);
    return result.count;
  } catch (error) {
    console.error("Failed to delete old announcements:", error);
    return 0;
  }
}

// GET: Fetch announcements (active or expired) with pagination
export async function GET(req: NextRequest) {
  try {
    await deleteOldAnnouncements();

    const { searchParams } = new URL(req.url);
    let type = searchParams.get("type") || "active";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (type !== "active" && type !== "expired") type = "active";

    // Fetch all announcements first to check individual expiration dates
    const allAnnouncements = await prisma.announcement.findMany({
      orderBy: { posted_at: "desc" },
    });

    // Filter based on custom expiration days
    const now = new Date();
    const filteredAnnouncements = allAnnouncements.filter(announcement => {
      const expirationDays = extractExpirationDays(announcement.content);
      const expirationDate = new Date(announcement.posted_at);
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      
      if (type === "active") {
        return expirationDate > now;
      } else {
        return expirationDate <= now;
      }
    });

    const total = filteredAnnouncements.length;
    const paginatedAnnouncements = filteredAnnouncements.slice(skip, skip + limit);

    // Add computed expiration_date and clean content
    const announcementsWithExpiration = paginatedAnnouncements.map(announcement => {
      const expirationDays = extractExpirationDays(announcement.content);
      const expirationDate = new Date(announcement.posted_at);
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      
      return {
        ...announcement,
        content: cleanContent(announcement.content),
        expiration_days: expirationDays,
        expiration_date: expirationDate.toISOString()
      };
    });

    return NextResponse.json({
      announcements: announcementsWithExpiration,
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
  try {
    const { title, content, posted_by, is_public, expiration_days }: AnnouncementBody =
      await req.json();

    if (!title || !content || !posted_by) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const days = expiration_days && expiration_days > 0 ? expiration_days : 14;
    const contentWithMetadata = addExpirationMetadata(content, days);

    const created = await prisma.announcement.create({
      data: { 
        title, 
        content: contentWithMetadata, 
        posted_by, 
        is_public: is_public ?? true,
      },
    });

    const expirationDate = new Date(created.posted_at);
    expirationDate.setDate(expirationDate.getDate() + days);

    const createdWithExpiration = {
      ...created,
      content: cleanContent(created.content),
      expiration_days: days,
      expiration_date: expirationDate.toISOString()
    };

    return NextResponse.json({ message: "Announcement created", created: createdWithExpiration });
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
  try {
    const { id, title, content, is_public, expiration_days }: AnnouncementBody =
      await req.json();

    if (!id || !title || !content) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get existing announcement to preserve posted_at
    const existing = await prisma.announcement.findUnique({
      where: { announcement_id: id }
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Announcement not found" },
        { status: 404 }
      );
    }

    const days = expiration_days && expiration_days > 0 ? expiration_days : extractExpirationDays(existing.content);
    const contentWithMetadata = addExpirationMetadata(content, days);

    const updated = await prisma.announcement.update({
      where: { announcement_id: id },
      data: { title, content: contentWithMetadata, is_public },
    });

    const expirationDate = new Date(updated.posted_at);
    expirationDate.setDate(expirationDate.getDate() + days);

    const updatedWithExpiration = {
      ...updated,
      content: cleanContent(updated.content),
      expiration_days: days,
      expiration_date: expirationDate.toISOString()
    };

    return NextResponse.json({ message: "Announcement updated", updated: updatedWithExpiration });
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
  try {
    const { id }: AnnouncementBody = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Announcement ID is required" },
        { status: 400 }
      );
    }

    await prisma.announcement.delete({
      where: { announcement_id: id },
    });

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete announcement failed:", error);
    return NextResponse.json(
      { message: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}