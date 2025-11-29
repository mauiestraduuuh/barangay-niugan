import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

interface AnnouncementBody {
  id?: number;
  title?: string;
  content?: string;
  posted_by?: number;
  is_public?: boolean;
}

// GET: Fetch announcements (active or expired)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let type = searchParams.get("type") || "active";

    // Enforce allowed values
    if (type !== "active" && type !== "expired") type = "active";

    const now = new Date();
    const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const filter =
      type === "active"
        ? { posted_at: { gte: cutoff } }
        : { posted_at: { lt: cutoff } };

    const announcements = await prisma.announcement.findMany({
      where: filter,
      orderBy: { posted_at: "desc" },
    });

    return NextResponse.json(announcements);
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
