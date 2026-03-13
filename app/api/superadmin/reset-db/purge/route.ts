import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

const ADMIN_SECRET = process.env.ADMIN_REGISTER_KEY;

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
  }

  const { ids }: { ids: number[] } = await req.json();

  if (!ids || ids.length === 0) {
    return NextResponse.json({ message: "No IDs provided." }, { status: 400 });
  }

  // Re-verify server-side — only delete those confirmed as departed
  const confirmed = await prisma.deletionConfirmation.findMany({
    where: {
      record_id: { in: ids },
      status: "confirmed_departure",
    },
  });

  if (confirmed.length === 0) {
    return NextResponse.json({ message: "No confirmed departures found." }, { status: 400 });
  }

  const residentIds = confirmed.filter((c) => c.record_type === "resident").map((c) => c.record_id);
  const staffIds    = confirmed.filter((c) => c.record_type === "staff").map((c) => c.record_id);

  // Resolve user_ids so we can cascade delete from User downward
  const [residentUsers, staffUsers] = await Promise.all([
    residentIds.length > 0
      ? prisma.resident.findMany({
          where: { resident_id: { in: residentIds } },
          select: { user_id: true },
        })
      : [],
    staffIds.length > 0
      ? prisma.staff.findMany({
          where: { staff_id: { in: staffIds } },
          select: { user_id: true },
        })
      : [],
  ]);

  const userIdsToDelete = [
    ...(residentUsers as { user_id: number }[]).map((r) => r.user_id),
    ...(staffUsers as { user_id: number }[]).map((s) => s.user_id),
  ];

  await prisma.$transaction(async (tx) => {
    // Deleting User cascades to:
    //   → Resident / Staff (onDelete: Cascade on user_id)
    //   → CertificateRequest, Feedback, Clearance, DigitalID,
    //     DemographicTag, Notification (all Cascade from Resident/Staff)
    await tx.user.deleteMany({
      where: { user_id: { in: userIdsToDelete } },
    });

    // Clean up the confirmation records
    await tx.deletionConfirmation.deleteMany({
      where: { record_id: { in: confirmed.map((c) => c.record_id) } },
    });
  });

  return NextResponse.json({
    message: `Successfully deleted ${residentIds.length} resident(s) and ${staffIds.length} staff member(s).`,
    deleted: { residents: residentIds.length, staff: staffIds.length },
  });
}