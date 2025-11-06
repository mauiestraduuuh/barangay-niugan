import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma"; // adjust path to your prisma client
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
  userId: number;
  role: string;
}

// ===================== HELPER: VERIFY TOKEN =====================
function verifyToken(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

// ===================== GET DASHBOARD DATA =====================
export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch admin info
    const adminUser = await prisma.user.findUnique({
      where: { user_id: payload.userId },
      select: { user_id: true, username: true, role: true },
    });

    // Overview counts
    const totalResidents = await prisma.resident.count();
    const totalStaff = await prisma.staff.count();
    const totalCertificates = await prisma.certificateRequest.count();
    const totalFeedback = await prisma.feedback.count();
    const totalAnnouncements = await prisma.announcement.count();

    const overview = {
      totalResidents,
      totalCertificates,
      totalFeedback,
      totalStaff,
      totalAnnouncements,
    };

    // Monthly Registrations (last 12 months)
    const monthlyRegistrationsRaw = await prisma.registrationRequest.groupBy({
      by: ["submitted_at"],
      _count: { request_id: true },
    });

    // Transform to { month: "Jan", count: 5 } format
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyRegistrations = monthlyRegistrationsRaw.map(item => ({
      month: monthNames[item.submitted_at.getMonth()],
      count: item._count.request_id,
    }));

    // Recent Activity (last 5 certificate requests)
    const recentActivityRaw = await prisma.certificateRequest.findMany({
      orderBy: { requested_at: "desc" },
      take: 5,
      include: { resident: { select: { first_name: true, last_name: true } } },
    });

    const recentActivity = recentActivityRaw.map(req => ({
      request_id: req.request_id,
      certificate_type: req.certificate_type,
      resident: req.resident,
      requested_at: req.requested_at.toISOString(),
    }));

    return NextResponse.json({
      admin: {
        id: adminUser!.user_id,
        name: adminUser!.username,
        role: adminUser!.role
      },
      overview,
      monthlyRegistrations,
      recentActivity,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
