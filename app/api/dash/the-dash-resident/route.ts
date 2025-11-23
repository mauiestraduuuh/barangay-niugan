import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromToken(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

// Helper: compute days until expiry
function daysUntil(date: Date) {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) 
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Resident info
    const resident = await prisma.resident.findFirst({
      where: { user_id: userId },
      select: {
        resident_id: true,
        first_name: true,
        last_name: true,
        address: true,
        gender: true,
        photo_url: true,
        is_4ps_member: true,
        is_pwd: true,
        senior_mode: true,
        is_renter: true
      },
    });

    // Announcements (latest 5, only public)
    const rawAnnouncements = await prisma.announcement.findMany({
      where: { is_public: true },
      orderBy: { posted_at: "desc" },
      take: 5,
    });

    // Add expiry info: announcements expire after 14 days
    const announcements = rawAnnouncements.map((ann) => {
      const postedAt = new Date(ann.posted_at);
      const expiryDate = new Date(postedAt);
      expiryDate.setDate(expiryDate.getDate() + 14); // 14-day expiry
      const expiresInDays = daysUntil(expiryDate);

      return {
        ...ann,
        expiresInDays: expiresInDays > 0 ? expiresInDays : 0,
        expired: expiresInDays <= 0,
      };
    });

    // Dashboard summary stats
    const totalCertificates = await prisma.certificateRequest.count({
      where: { resident_id: resident?.resident_id },
    });
    const pendingCertificates = await prisma.certificateRequest.count({
      where: { resident_id: resident?.resident_id, status: "PENDING" },
    });
    const totalFeedbacks = await prisma.feedback.count({
      where: { resident_id: resident?.resident_id },
    });
    const pendingFeedbacks = await prisma.feedback.count({
      where: { resident_id: resident?.resident_id, status: "PENDING" },
    });

    const summary = {
      totalCertificates,
      pendingCertificates,
      totalFeedbacks,
      pendingFeedbacks,
    };

    return NextResponse.json({ resident, announcements, summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch dashboard" }, { status: 500 });
  }
}
