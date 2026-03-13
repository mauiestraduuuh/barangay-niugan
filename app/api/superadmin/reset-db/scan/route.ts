import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

const ADMIN_SECRET = process.env.ADMIN_REGISTER_KEY;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
  }

  try {
    const yearStart = new Date(`${new Date().getFullYear()}-01-01T00:00:00.000Z`);
    const yearEnd   = new Date(`${new Date().getFullYear()}-12-31T23:59:59.999Z`);

    // ── Exclude already-confirmed-staying ─────────────────────────────────
    const alreadyConfirmed = await prisma.deletionConfirmation.findMany({
      where: { status: "confirmed_staying" },
      select: { record_id: true, record_type: true },
    });
    const confirmedResidentIds = alreadyConfirmed
      .filter((r) => r.record_type === "resident")
      .map((r) => r.record_id);
    const confirmedStaffIds = alreadyConfirmed
      .filter((r) => r.record_type === "staff")
      .map((r) => r.record_id);

    // ── RESIDENTS ──────────────────────────────────────────────────────────
    const [activeByCert, activeByFeedback, activeByClearance] = await Promise.all([
      prisma.certificateRequest.findMany({
        where: { requested_at: { gte: yearStart, lte: yearEnd } },
        select: { resident_id: true },
        distinct: ["resident_id"],
      }),
      prisma.feedback.findMany({
        where: { submitted_at: { gte: yearStart, lte: yearEnd } },
        select: { resident_id: true },
        distinct: ["resident_id"],
      }),
      prisma.clearance.findMany({
        where: { requested_at: { gte: yearStart, lte: yearEnd } },
        select: { resident_id: true },
        distinct: ["resident_id"],
      }),
    ]);

    const activeResidentIds = [
      ...new Set([
        ...activeByCert.map((r) => r.resident_id),
        ...activeByFeedback.map((r) => r.resident_id),
        ...activeByClearance.map((r) => r.resident_id),
      ]),
    ];

    const inactiveResidents = await prisma.resident.findMany({
      where: {
        resident_id: {
          notIn: [...activeResidentIds, ...confirmedResidentIds],
        },
      },
      select: { resident_id: true, first_name: true, last_name: true, contact_no: true },
    });

    // ── STAFF ──────────────────────────────────────────────────────────────
    const [
      approvedCerts, claimedCerts, respondedFeedbacks,
      issuedClearances, postedAnnouncements, createdEvents,
    ] = await Promise.all([
      prisma.certificateRequest.findMany({
        where: { approved_at: { gte: yearStart, lte: yearEnd }, approved_by: { not: null } },
        select: { approved_by: true }, distinct: ["approved_by"],
      }),
      prisma.certificateRequest.findMany({
        where: { claimed_at: { gte: yearStart, lte: yearEnd }, claimed_by: { not: null } },
        select: { claimed_by: true }, distinct: ["claimed_by"],
      }),
      prisma.feedback.findMany({
        where: { responded_at: { gte: yearStart, lte: yearEnd }, responded_by: { not: null } },
        select: { responded_by: true }, distinct: ["responded_by"],
      }),
      prisma.clearance.findMany({
        where: { issued_at: { gte: yearStart, lte: yearEnd }, issued_by: { not: null } },
        select: { issued_by: true }, distinct: ["issued_by"],
      }),
      prisma.announcement.findMany({
        where: { posted_at: { gte: yearStart, lte: yearEnd } },
        select: { posted_by: true }, distinct: ["posted_by"],
      }),
      prisma.event.findMany({
        where: { created_at: { gte: yearStart, lte: yearEnd }, created_by: { not: null } },
        select: { created_by: true }, distinct: ["created_by"],
      }),
    ]);

    const activeUserIds = [
      ...new Set([
        ...approvedCerts.map((r) => r.approved_by!),
        ...claimedCerts.map((r) => r.claimed_by!),
        ...respondedFeedbacks.map((r) => r.responded_by!),
        ...issuedClearances.map((r) => r.issued_by!),
        ...postedAnnouncements.map((r) => r.posted_by),
        ...createdEvents.map((r) => r.created_by!),
      ]),
    ].filter((id): id is number => id !== null);

    const activeStaffByUser = activeUserIds.length > 0
      ? await prisma.staff.findMany({
          where: { user_id: { in: activeUserIds } },
          select: { staff_id: true },
        })
      : [];

    const activeStaffIds = activeStaffByUser.map((s) => s.staff_id);

    const inactiveStaff = await prisma.staff.findMany({
      where: {
        staff_id: {
          notIn: [...activeStaffIds, ...confirmedStaffIds],
        },
      },
      select: { staff_id: true, first_name: true, last_name: true, contact_no: true },
    });

    const inactive = [
      ...inactiveResidents.map((r) => ({
        id: r.resident_id, type: "resident" as const,
        full_name: `${r.first_name} ${r.last_name}`,
        contact_no: r.contact_no ?? null, last_activity: null,
      })),
      ...inactiveStaff.map((s) => ({
        id: s.staff_id, type: "staff" as const,
        full_name: `${s.first_name} ${s.last_name}`,
        contact_no: s.contact_no ?? null, last_activity: null,
      })),
    ];

    return NextResponse.json({ inactive });
  } catch (error) {
    console.error("Scan failed:", error);
    return NextResponse.json({ message: "Scan failed", error: String(error) }, { status: 500 });
  }
}