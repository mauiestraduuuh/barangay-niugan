import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
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

// ===================== HELPER: VERIFY STAFF USER =====================
async function verifyStaffUser(userId: number) {
  const staff = await prisma.staff.findFirst({
    where: { user_id: userId },
  });
  return staff !== null;
}

// ===================== GET DASHBOARD DATA =====================
export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload || payload.role !== "STAFF") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifyStaffUser(payload.userId))) {
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  try {
    // Fetch staff info
    const staffUser = await prisma.user.findUnique({
      where: { user_id: payload.userId },
      select: {
        user_id: true,
        username: true,
        role: true,
        staffs: {
          select: {
            staff_id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // REQUIREMENT E: Staff dashboard shouldn't have analytics/overview counts
    // Instead, provide operational data only

    // Recent Activity (last 10 certificate requests for staff to monitor)
    const recentActivityRaw = await prisma.certificateRequest.findMany({
      orderBy: { requested_at: "desc" },
      take: 10,
      include: { resident: { select: { first_name: true, last_name: true } } },
    });

    const recentActivity = recentActivityRaw.map(req => ({
      request_id: req.request_id,
      certificate_type: req.certificate_type,
      status: req.status,
      resident: req.resident,
      requested_at: req.requested_at.toISOString(),
    }));

    // Pending Registration Requests (RESIDENTS ONLY - Requirement C)
    const pendingRegistrations = await prisma.registrationRequest.count({
      where: {
        status: "PENDING",
        role: "RESIDENT",
      },
    });

    // Pending Certificate Requests
    const pendingCertificates = await prisma.certificateRequest.count({
      where: { status: "PENDING" },
    });

    // Recent Announcements (last 5)
    const recentAnnouncements = await prisma.announcement.findMany({
      orderBy: { posted_at: "desc" },
      take: 5,
      select: {
        announcement_id: true,
        title: true,
        posted_at: true,
        is_public: true,
      },
    });

    return NextResponse.json({
      staff: {
        id: staffUser!.user_id,
        name: staffUser!.username,
        role: staffUser!.role,
        firstName: staffUser!.staffs[0]?.first_name || "",
        lastName: staffUser!.staffs[0]?.last_name || "",
      },
      // NO ANALYTICS - only operational data
      pendingTasks: {
        pendingRegistrations,
        pendingCertificates,
      },
      recentActivity,
      recentAnnouncements,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}