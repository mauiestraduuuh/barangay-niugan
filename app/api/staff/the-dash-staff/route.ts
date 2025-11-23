import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
  userId: number;
  role: string;
}

interface StaffDashboardResponse {
  staff: {
    id: number;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
  };
  pendingTasks: {
    pendingRegistrations: number;
    pendingCertificates: number;
  };
  recentActivity: {
    request_id: number;
    certificate_type: string;
    status: string;
    resident: { first_name: string; last_name: string };
    requested_at: string;
  }[];
  recentAnnouncements: {
    announcement_id: number;
    title: string;
    posted_at: string;
    is_public: boolean;
  }[];
}

// ===================== HELPER: VERIFY TOKEN =====================
function verifyToken(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ===================== HELPER: VERIFY STAFF USER =====================
async function verifyStaffUser(userId: number) {
  return await prisma.staff.findFirst({
    where: { user_id: userId },
  });
}

// ===================== GET STAFF DASHBOARD =====================
export async function GET(req: NextRequest) {
  const payload = verifyToken(req);

  // Must be STAFF
  if (!payload || payload.role !== "STAFF") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate that user exists in STAFF table
  const staffRecord = await verifyStaffUser(payload.userId);
  if (!staffRecord) {
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  try {
    // Staff user information
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

    // ===================== OPERATIONAL DATA =====================
      // Recent certificate activity
      const recentActivityRaw = await prisma.certificateRequest.findMany({
        orderBy: { requested_at: "desc" },
        take: 10,
        include: { resident: { select: { first_name: true, last_name: true } } },
      });

      const recentActivity = recentActivityRaw.map((req) => ({
        request_id: req.request_id,
        certificate_type: req.certificate_type,
        status: req.status,
        resident: req.resident,
        requested_at: req.requested_at.toISOString(),
      }));

      // Recent announcements
      const recentAnnouncementsRaw = await prisma.announcement.findMany({
        orderBy: { posted_at: "desc" },
        take: 5,
        select: {
          announcement_id: true,
          title: true,
          posted_at: true,
          is_public: true,
        },
      });

      const recentAnnouncements = recentAnnouncementsRaw.map((ann) => ({
        announcement_id: ann.announcement_id,
        title: ann.title,
        posted_at: ann.posted_at.toISOString(),
        is_public: ann.is_public,
      }));


    // Pending resident registration requests
    const pendingRegistrations = await prisma.registrationRequest.count({
      where: { status: "PENDING", role: "RESIDENT" },
    });

    // Pending certificate requests
    const pendingCertificates = await prisma.certificateRequest.count({
      where: { status: "PENDING" },
    });

  

    // ===================== RESPONSE =====================
    const response: StaffDashboardResponse = {
      staff: {
        id: staffUser!.user_id,
        username: staffUser!.username,
        role: staffUser!.role,
        firstName: staffUser!.staffs[0]?.first_name || "",
        lastName: staffUser!.staffs[0]?.last_name || "",
      },
      pendingTasks: {
        pendingRegistrations,
        pendingCertificates,
      },
      recentActivity,
      recentAnnouncements,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
