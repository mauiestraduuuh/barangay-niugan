import { NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

//GET summarized statistics for reports page
export async function GET() {
  try {
    const stats = {
      totalResidents: await prisma.resident.count(),
      totalStaff: await prisma.staff.count(),
      totalCertificates: await prisma.certificateRequest.count(),
      totalFeedback: await prisma.feedback.count(),
      totalAnnouncements: await prisma.announcement.count(),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Report generation failed:", error);
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 });
  }
}
