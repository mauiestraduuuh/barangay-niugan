import { NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

//GET dashboard summary data for admin dashboard
export async function GET() {
  try {
    //counts for quick dashboard overview
    const totalResidents = await prisma.resident.count();
    const totalStaff = await prisma.staff.count();
    const pendingCertificates = await prisma.certificateRequest.count({
      where: { status: "PENDING" },
    });
    const totalFeedback = await prisma.feedback.count();

    //get recent announcements and feedbacks
    const recentAnnouncements = await prisma.announcement.findMany({
      orderBy: { posted_at: "desc" },
      take: 5,
    });

    const recentFeedback = await prisma.feedback.findMany({
      orderBy: { submitted_at: "desc" },
      take: 5,
      include: { resident: true },
    });

    return NextResponse.json({
      summary: {
        totalResidents,
        totalStaff,
        pendingCertificates,
        totalFeedback,
      },
      recentAnnouncements,
      recentFeedback,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
