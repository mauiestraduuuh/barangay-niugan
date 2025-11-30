import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

interface AnnouncementBody {
  id?: number;
  title?: string;
  content?: string;
  posted_by?: number;
  is_public?: boolean;
  page?: number;
  limit?: number;
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

// GET: Fetch announcements (active or expired) with pagination
export async function GET(req: NextRequest) {
  try {
    // Delete expired announcements first
    await deleteExpiredAnnouncements();

    const { searchParams } = new URL(req.url);
    let type = searchParams.get("type") || "active";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Enforce allowed values
    if (type !== "active" && type !== "expired") type = "active";

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const filter =
      type === "active"
        ? { posted_at: { gte: fourteenDaysAgo } }
        : { posted_at: { lt: fourteenDaysAgo } };

    // Get total count for pagination
    const total = await prisma.announcement.count({
      where: filter,
    });

    // Fetch paginated announcements
    const announcements = await prisma.announcement.findMany({
      where: filter,
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
  try {
    const { title, content, posted_by, is_public }: AnnouncementBody =
      await req.json();

    if (!title || !content || !posted_by) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const created = await prisma.announcement.create({
      data: { title, content, posted_by, is_public: is_public ?? true },
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
  try {
    const { id, title, content, is_public }: AnnouncementBody =
      await req.json();

    if (!id || !title || !content) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
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