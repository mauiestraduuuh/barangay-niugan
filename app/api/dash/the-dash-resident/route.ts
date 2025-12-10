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

// Extract expiration days from "[EXP_DAYS:10]"
function extractExpirationDays(content: string | null): number {
  if (!content) return 14;
  const match = content.match(/\[EXP_DAYS:(\d+)\]$/);
  return match ? parseInt(match[1]) : 14;
}

// Remove metadata tag before sending to frontend
function cleanContent(content: string | null): string {
  if (!content) return "";
  return content.replace(/\[EXP_DAYS:\d+\]$/, "");
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
        is_renter: true,
      },
    });

    // Fetch announcements
    const rawAnnouncements = await prisma.announcement.findMany({
      where: { is_public: true },
      orderBy: { posted_at: "desc" },
    });

    const now = new Date();

    // Normalize expiration logic and FILTER OUT expired announcements
    const announcements = rawAnnouncements
      .map((ann) => {
        const expirationDays = extractExpirationDays(ann.content);
        const postedAt = new Date(ann.posted_at);

        const expirationDate = new Date(postedAt);
        expirationDate.setDate(expirationDate.getDate() + expirationDays);

        return {
          ...ann,
          content: cleanContent(ann.content),
          expiration_days: expirationDays,
          expiration_date: expirationDate.toISOString(),
          _expirationDate: expirationDate, // Temp field for filtering
        };
      })
      .filter((ann) => ann._expirationDate > now) // Remove expired announcements
      .slice(0, 5) // Take only 5 most recent non-expired
      .map(({ _expirationDate, ...rest }) => rest); // Remove temp field

    // Dashboard summary
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
    return NextResponse.json(
      { message: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}