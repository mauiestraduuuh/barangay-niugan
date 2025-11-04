import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

//GET all announcements
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { posted_at: "desc" },
    });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Fetch announcements failed:", error);
    return NextResponse.json({ message: "Failed to fetch announcements" }, { status: 500 });
  }
}

//POST create a new announcement
export async function POST(req: NextRequest) {
  try {
    const { title, content, posted_by, is_public } = await req.json();

    const created = await prisma.announcement.create({
      data: { title, content, posted_by, is_public },
    });

    return NextResponse.json({ message: "Announcement created", created });
  } catch (error) {
    console.error("Create announcement failed:", error);
    return NextResponse.json({ message: "Failed to create announcement" }, { status: 500 });
  }
}

//PUT update an existing announcement
export async function PUT(req: NextRequest) {
  try {
    const { id, title, content, is_public } = await req.json();

    const updated = await prisma.announcement.update({
      where: { announcement_id: id },
      data: { title, content, is_public },
    });

    return NextResponse.json({ message: "Announcement updated", updated });
  } catch (error) {
    console.error("Update announcement failed:", error);
    return NextResponse.json({ message: "Failed to update announcement" }, { status: 500 });
  }
}

//DELETE an announcement
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.announcement.delete({ where: { announcement_id: id } });
    return NextResponse.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete announcement failed:", error);
    return NextResponse.json({ message: "Failed to delete announcement" }, { status: 500 });
  }
}
