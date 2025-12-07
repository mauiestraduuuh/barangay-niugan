import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
  userId: number;
  role: string;
}

// ===================== NEW: TYPE DEFINITIONS =====================
interface UrgentItem {
  id: number;
  type: 'certificate' | 'feedback' | 'registration';
  title: string;
  resident_name: string;
  days_waiting: number;
  priority: 'high' | 'medium' | 'low';
  link: string;
}

interface SystemAlert {
  id: number;
  type: 'warning' | 'error' | 'info';
  message: string;
  count?: number;
  action_link?: string;
}

interface StaffPerformance {
  staff_id: number;
  name: string;
  completed_today: number;
  completed_this_week: number;
  pending_assigned: number;
  avg_completion_time: number;
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

    // ===================== SYSTEM ALERTS =====================
    const systemAlerts: SystemAlert[] = [];
    
    const oldCertificates = await prisma.certificateRequest.count({
      where: {
        status: "PENDING",
        requested_at: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    if (oldCertificates > 0) {
      systemAlerts.push({
        id: 1,
        type: "error",
        message: `${oldCertificates} certificate requests waiting over 7 days`,
        count: oldCertificates,
        action_link: "/admin-front/certificate-request"
      });
    }

    const oldFeedback = await prisma.feedback.count({
      where: {
        status: "PENDING",
        submitted_at: {
          lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (oldFeedback > 0) {
      systemAlerts.push({
        id: 2,
        type: "warning",
        message: `${oldFeedback} complaints unanswered for over 3 days`,
        count: oldFeedback,
        action_link: "/admin-front/feedback"
      });
    }

    const pendingRegistrations = await prisma.registrationRequest.count({
      where: { status: "PENDING" }
    });

    if (pendingRegistrations > 10) {
      systemAlerts.push({
        id: 3,
        type: "warning",
        message: `${pendingRegistrations} registration requests need review`,
        count: pendingRegistrations,
        action_link: "/admin-front/registration-request"
      });
    }

    // ===================== URGENT ITEMS =====================
    const urgentItems: UrgentItem[] = [];

    const urgentCertificates = await prisma.certificateRequest.findMany({
      where: {
        status: "PENDING",
        requested_at: {
          lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      },
      take: 10,
      orderBy: { requested_at: "asc" },
      include: {
        resident: {
          select: { first_name: true, last_name: true }
        }
      }
    });

    urgentCertificates.forEach(cert => {
      const daysWaiting = Math.floor(
        (Date.now() - new Date(cert.requested_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      urgentItems.push({
        id: cert.request_id,
        type: "certificate",
        title: cert.certificate_type,
        resident_name: `${cert.resident.first_name} ${cert.resident.last_name}`,
        days_waiting: daysWaiting,
        priority: daysWaiting > 7 ? "high" : daysWaiting > 5 ? "medium" : "low",
        link: "/admin-front/certificate-request"
      });
    });

    const urgentFeedbackItems = await prisma.feedback.findMany({
      where: {
        status: "PENDING",
        submitted_at: {
          lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      },
      take: 10,
      orderBy: { submitted_at: "asc" },
      include: {
        resident: {
          select: { first_name: true, last_name: true }
        }
      }
    });

    urgentFeedbackItems.forEach(feedback => {
      const daysWaiting = Math.floor(
        (Date.now() - new Date(feedback.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      let title = "Feedback";
      if ('complaint' in feedback && feedback.complaint) {
        title = String(feedback.complaint).substring(0, 50) + "...";
      } else if ('message' in feedback && feedback.message) {
        title = String(feedback.message).substring(0, 50) + "...";
      } else if ('feedback_text' in feedback && feedback.feedback_text) {
        title = String(feedback.feedback_text).substring(0, 50) + "...";
      } else {
        title = `Feedback #${feedback.feedback_id}`;
      }

      urgentItems.push({
        id: feedback.feedback_id,
        type: "feedback",
        title: title,
        resident_name: `${feedback.resident.first_name} ${feedback.resident.last_name}`,
        days_waiting: daysWaiting,
        priority: daysWaiting > 5 ? "high" : daysWaiting > 3 ? "medium" : "low",
        link: "/admin-front/feedback"
      });
    });

    const urgentRegistrations = await prisma.registrationRequest.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { submitted_at: "asc" },
    });

    urgentRegistrations.forEach(reg => {
      const daysWaiting = Math.floor(
        (Date.now() - new Date(reg.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      urgentItems.push({
        id: reg.request_id,
        type: "registration",
        title: `${reg.first_name} ${reg.last_name}`,
        resident_name: reg.email || "N/A",
        days_waiting: daysWaiting,
        priority: daysWaiting > 3 ? "high" : "medium",
        link: "/admin-front/registration-request"
      });
    });

    urgentItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.days_waiting - a.days_waiting;
    });

   // ===================== FIXED: STAFF PERFORMANCE =====================
const staffList = await prisma.staff.findMany({
  select: {
    staff_id: true,
    first_name: true,
    last_name: true,
    user_id: true, // <- IMPORTANT: We need user_id to query relations
  }
});

// Define time boundaries
const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
const weekStart = new Date(now);
weekStart.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
weekStart.setHours(0, 0, 0, 0);

const staffPerformance: StaffPerformance[] = await Promise.all(
  staffList.map(async (staff) => {
    // ===== CERTIFICATES =====
    // Use user_id instead of staff_id for all queries
    
    // Completed TODAY (approved or claimed today)
    const certsCompletedToday = await prisma.certificateRequest.count({
      where: {
        OR: [
          {
            approved_by: staff.user_id, // <- Changed from staff_id
            approved_at: { gte: todayStart },
            status: { in: ["APPROVED", "CLAIMED"] }
          },
          {
            claimed_by: staff.user_id, // <- Changed from staff_id
            claimed_at: { gte: todayStart },
            status: "CLAIMED"
          }
        ]
      }
    });

    // Completed THIS WEEK
    const certsCompletedThisWeek = await prisma.certificateRequest.count({
      where: {
        OR: [
          {
            approved_by: staff.user_id, // <- Changed from staff_id
            approved_at: { gte: weekStart },
            status: { in: ["APPROVED", "CLAIMED"] }
          },
          {
            claimed_by: staff.user_id, // <- Changed from staff_id
            claimed_at: { gte: weekStart },
            status: "CLAIMED"
          }
        ]
      }
    });

    // ===== REGISTRATIONS =====
    // Processed TODAY
    const regsCompletedToday = await prisma.registrationRequest.count({
      where: {
        approved_by: staff.user_id, // <- Changed from staff_id
        approved_at: { gte: todayStart },
        status: { in: ["APPROVED", "REJECTED"] }
      }
    });

    // Processed THIS WEEK
    const regsCompletedThisWeek = await prisma.registrationRequest.count({
      where: {
        approved_by: staff.user_id, // <- Changed from staff_id
        approved_at: { gte: weekStart },
        status: { in: ["APPROVED", "REJECTED"] }
      }
    });

    // ===== FEEDBACK =====
    // Responded TODAY (if you have a responded_by field)
    const feedbackCompletedToday = await prisma.feedback.count({
      where: {
        responded_by: staff.user_id, // <- Changed from staff_id
        responded_at: { gte: todayStart },
        status: { in: ["IN_PROGRESS", "RESOLVED"] } // Don't count PENDING as completed
      }
    });

    // Responded THIS WEEK
    const feedbackCompletedThisWeek = await prisma.feedback.count({
      where: {
        responded_by: staff.user_id, // <- Changed from staff_id
        responded_at: { gte: weekStart },
        status: { in: ["IN_PROGRESS", "RESOLVED"] }
      }
    });

    // TOTAL COMPLETED (all types)
    const totalCompletedToday = certsCompletedToday + regsCompletedToday + feedbackCompletedToday;
    const totalCompletedThisWeek = certsCompletedThisWeek + regsCompletedThisWeek + feedbackCompletedThisWeek;

    // ===== PENDING ITEMS =====
    // Count total pending items (system-wide)
    const pendingCerts = await prisma.certificateRequest.count({
      where: { status: "PENDING" }
    });
    const pendingFeedback = await prisma.feedback.count({
      where: { status: "PENDING" }
    });
    const pendingRegs = await prisma.registrationRequest.count({
      where: { status: "PENDING" }
    });
    
    // Rough estimate per staff member (divide equally)
    const totalPending = pendingCerts + pendingFeedback + pendingRegs;
    const pendingAssigned = staffList.length > 0 ? Math.ceil(totalPending / staffList.length) : 0;

    // ===== AVERAGE COMPLETION TIME =====
    // Get completed certificates with timestamps
    const completedCerts = await prisma.certificateRequest.findMany({
      where: {
        approved_by: staff.user_id, // <- Changed from staff_id
        status: { in: ["APPROVED", "CLAIMED"] },
        approved_at: { not: null },
      },
      select: {
        requested_at: true,
        approved_at: true
      },
      take: 20,
      orderBy: { approved_at: 'desc' }
    });

    // Get completed registrations with timestamps
    const completedRegs = await prisma.registrationRequest.findMany({
      where: {
        approved_by: staff.user_id, // <- Changed from staff_id
        status: { in: ["APPROVED", "REJECTED"] },
        approved_at: { not: null },
      },
      select: {
        submitted_at: true,
        approved_at: true
      },
      take: 20,
      orderBy: { approved_at: 'desc' }
    });

    // Calculate average completion time in hours
    let totalTimeMs = 0;
    let totalCount = 0;

    completedCerts.forEach(cert => {
      if (cert.approved_at && cert.requested_at) {
        totalTimeMs += new Date(cert.approved_at).getTime() - new Date(cert.requested_at).getTime();
        totalCount++;
      }
    });

    completedRegs.forEach(reg => {
      if (reg.approved_at && reg.submitted_at) {
        totalTimeMs += new Date(reg.approved_at).getTime() - new Date(reg.submitted_at).getTime();
        totalCount++;
      }
    });

    const avgCompletionTime = totalCount > 0 
      ? Math.round(totalTimeMs / totalCount / (1000 * 60 * 60)) // Convert to hours
      : 0;

    return {
      staff_id: staff.staff_id,
      name: `${staff.first_name} ${staff.last_name}`,
      completed_today: totalCompletedToday,
      completed_this_week: totalCompletedThisWeek,
      pending_assigned: pendingAssigned,
      avg_completion_time: avgCompletionTime
    };
  })
);

// Sort by completed today (most productive first)
staffPerformance.sort((a, b) => b.completed_today - a.completed_today);


    // ===================== KEEP ORIGINAL DATA =====================
    const monthlyRegistrationsRaw = await prisma.registrationRequest.groupBy({
      by: ["submitted_at"],
      _count: { request_id: true },
    });

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyRegistrations = monthlyRegistrationsRaw.map(item => ({
      month: monthNames[item.submitted_at.getMonth()],
      count: item._count.request_id,
    }));

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
      systemAlerts,
      urgentItems,
      staffPerformance,
      monthlyRegistrations,
      recentActivity,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}