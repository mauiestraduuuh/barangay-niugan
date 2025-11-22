import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma"; // adjust if your prisma path differs

// ===============================
// GET - Fetch all public announcements
// ===============================
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { is_public: true },
      orderBy: { posted_at: "desc" },
    });

    return NextResponse.json(announcements, { status: 200 });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { message: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// ===============================
// POST - Create new announcement
// (Only for admin/staff roles ideally)
// ===============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, posted_by, is_public } = body;

    if (!title || !posted_by) {
      return NextResponse.json(
        { message: "Missing required fields: title or posted_by" },
        { status: 400 }
      );
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
        posted_by,
        is_public: is_public ?? true,
      },
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { message: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

// ===============================
// PUT - Update an announcement
// ===============================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { announcement_id, title, content, is_public } = body;

    if (!announcement_id) {
      return NextResponse.json(
        { message: "announcement_id is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.announcement.update({
      where: { announcement_id },
      data: {
        title,
        content,
        is_public,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { message: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// ===============================
// DELETE - Remove announcement
// ===============================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Announcement ID is required" },
        { status: 400 }
      );
    }

    await prisma.announcement.delete({
      where: { announcement_id: Number(id) },
    });

    return NextResponse.json(
      { message: "Announcement deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { message: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
