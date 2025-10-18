import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get("id");

    if (id) {
      const announcement = await prisma.announcement.findUnique({
        where: { announcement_id: parseInt(id) },
      });
      if (!announcement)
        return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
      return NextResponse.json(announcement);
    }

    const announcements = await prisma.announcement.findMany({
      where: { is_public: true },
      orderBy: { posted_at: "desc" },
      take: 20,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}
