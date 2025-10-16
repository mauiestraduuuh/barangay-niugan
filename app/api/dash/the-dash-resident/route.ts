import { NextRequest, NextResponse } from "next/server";
import { prisma } from "#/../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "User ID missing" }, { status: 400 });

    const resident = await prisma.resident.findFirst({
      where: { user_id: parseInt(userId) },
      select: {
        resident_id: true,
        first_name: true,
        last_name: true,
        birthdate: true,
        gender: true,
        address: true,
        contact_no: true,
        photo_url: true,
        senior_mode: true,
        is_head_of_family: true,
        household_number: true,
        is_4ps_member: true,
        is_indigenous: true,
        is_slp_beneficiary: true,
        is_pwd: true,
      },
    });

    if (!resident) return NextResponse.json({ message: "Resident not found" }, { status: 404 });

    const announcements = await prisma.announcement.findMany({
      where: { is_public: true },
      orderBy: { posted_at: "desc" },
      take: 10,
    });

    const notifications = announcements.map((a) => ({
      type: "announcement",
      message: a.title,
      date: a.posted_at,
    }));

    return NextResponse.json({ resident, announcements, notifications });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard", error: (error as Error).message },
      { status: 500 }
    );
  }
}
