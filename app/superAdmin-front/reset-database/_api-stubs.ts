/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SUPER ADMIN — Reset Database API Routes
 *  Based on actual schema (schema.prisma)
 *
 *  Route map:
 *  GET    /api/superadmin/reset-db/scan     → find inactive residents & staff
 *  POST   /api/superadmin/reset-db/notify   → send confirmation to each person
 *  GET    /api/superadmin/reset-db/status   → poll confirmation statuses
 *  DELETE /api/superadmin/reset-db/purge    → delete confirmed departures
 *  PATCH  /api/superadmin/reset-db/confirm  → resident/staff clicks their link
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Activity definitions (from schema):
 *
 *  RESIDENT activity = any record this year in:
 *    - CertificateRequest (resident_id, requested_at)
 *    - Feedback           (resident_id, submitted_at)
 *    - Clearance          (resident_id, requested_at)
 *
 *  STAFF activity = any record this year where their user_id appears in:
 *    - CertificateRequest.approved_by  (approved_at)
 *    - CertificateRequest.claimed_by   (claimed_at)
 *    - Feedback.responded_by           (responded_at)
 *    - Clearance.issued_by             (issued_at)
 *    - Announcement.posted_by          (posted_at)
 *    - Event.created_by                (created_at)
 *
 *  NEW Prisma model to add to schema.prisma:
 * ─────────────────────────────────────────────────────────────────────────────
 *  model DeletionConfirmation {
 *    id           Int       @id @default(autoincrement())
 *    record_id    Int       // resident_id or staff_id
 *    record_type  String    // "resident" | "staff"
 *    full_name    String
 *    contact_no   String?
 *    token        String    @unique @default(uuid())
 *    status       String    @default("pending")
 *                           // "pending" | "confirmed_departure" | "confirmed_staying"
 *    notified_at  DateTime  @default(now())
 *    responded_at DateTime?
 *  }
 *
 *  Then run: npx prisma migrate dev --name add_deletion_confirmation
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

const ADMIN_SECRET = process.env.ADMIN_REGISTER_KEY;

function unauthorized() {
  return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
}
function checkAuth(req: NextRequest) {
  return req.headers.get("x-admin-secret") === ADMIN_SECRET;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/superadmin/reset-db/scan/route.ts
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET_SCAN(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const yearStart = new Date(`${new Date().getFullYear()}-01-01T00:00:00.000Z`);
  const yearEnd   = new Date(`${new Date().getFullYear()}-12-31T23:59:59.999Z`);

  // ── RESIDENTS ──────────────────────────────────────────────────────────────
  // Union of all resident_ids active this year across 3 activity tables.
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
    where: { resident_id: { notIn: activeResidentIds } },
    select: {
      resident_id: true,
      first_name:  true,
      last_name:   true,
      contact_no:  true,
    },
  });

  // ── STAFF ──────────────────────────────────────────────────────────────────
  // Staff don't have a direct activity table — their activity is tracked via
  // user_id in approval/response columns. We collect active user_ids, then
  // map them back to staff records to find the inactive ones.
  const [
    approvedCerts,
    claimedCerts,
    respondedFeedbacks,
    issuedClearances,
    postedAnnouncements,
    createdEvents,
  ] = await Promise.all([
    prisma.certificateRequest.findMany({
      where: { approved_at: { gte: yearStart, lte: yearEnd }, approved_by: { not: null } },
      select: { approved_by: true },
      distinct: ["approved_by"],
    }),
    prisma.certificateRequest.findMany({
      where: { claimed_at: { gte: yearStart, lte: yearEnd }, claimed_by: { not: null } },
      select: { claimed_by: true },
      distinct: ["claimed_by"],
    }),
    prisma.feedback.findMany({
      where: { responded_at: { gte: yearStart, lte: yearEnd }, responded_by: { not: null } },
      select: { responded_by: true },
      distinct: ["responded_by"],
    }),
    prisma.clearance.findMany({
      where: { issued_at: { gte: yearStart, lte: yearEnd }, issued_by: { not: null } },
      select: { issued_by: true },
      distinct: ["issued_by"],
    }),
    prisma.announcement.findMany({
      where: { posted_at: { gte: yearStart, lte: yearEnd } },
      select: { posted_by: true },
      distinct: ["posted_by"],
    }),
    prisma.event.findMany({
      where: { created_at: { gte: yearStart, lte: yearEnd }, created_by: { not: null } },
      select: { created_by: true },
      distinct: ["created_by"],
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
  ];

  // Find staff whose user_id is in the active set, then exclude them
  const activeStaffByUser = await prisma.staff.findMany({
    where: { user_id: { in: activeUserIds } },
    select: { staff_id: true },
  });
  const activeStaffIds = activeStaffByUser.map((s) => s.staff_id);

  const inactiveStaff = await prisma.staff.findMany({
    where: { staff_id: { notIn: activeStaffIds } },
    select: {
      staff_id:   true,
      first_name: true,
      last_name:  true,
      contact_no: true,
    },
  });

  const inactive = [
    ...inactiveResidents.map((r) => ({
      id:         r.resident_id,
      type:       "resident" as const,
      full_name:  `${r.first_name} ${r.last_name}`,
      contact_no: r.contact_no ?? null,
    })),
    ...inactiveStaff.map((s) => ({
      id:         s.staff_id,
      type:       "staff" as const,
      full_name:  `${s.first_name} ${s.last_name}`,
      contact_no: s.contact_no ?? null,
    })),
  ];

  return NextResponse.json({ inactive });
}


// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/superadmin/reset-db/notify/route.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Body: { records: Array<{ id: number; type: "resident" | "staff" }> }
export async function POST_NOTIFY(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const { records }: { records: { id: number; type: "resident" | "staff" }[] } = await req.json();

  const residentIds = records.filter((r) => r.type === "resident").map((r) => r.id);
  const staffIds    = records.filter((r) => r.type === "staff").map((r) => r.id);

  const [residents, staffs] = await Promise.all([
    prisma.resident.findMany({
      where: { resident_id: { in: residentIds } },
      select: { resident_id: true, first_name: true, last_name: true, contact_no: true },
    }),
    prisma.staff.findMany({
      where: { staff_id: { in: staffIds } },
      select: { staff_id: true, first_name: true, last_name: true, contact_no: true },
    }),
  ]);

  // Remove any old pending confirmations for these records before recreating
  await prisma.deletionConfirmation.deleteMany({
    where: { record_id: { in: records.map((r) => r.id) }, status: "pending" },
  });

  const created = await Promise.all([
    ...residents.map((r) =>
      prisma.deletionConfirmation.create({
        data: {
          record_id:   r.resident_id,
          record_type: "resident",
          full_name:   `${r.first_name} ${r.last_name}`,
          contact_no:  r.contact_no ?? null,
        },
      })
    ),
    ...staffs.map((s) =>
      prisma.deletionConfirmation.create({
        data: {
          record_id:   s.staff_id,
          record_type: "staff",
          full_name:   `${s.first_name} ${s.last_name}`,
          contact_no:  s.contact_no ?? null,
        },
      })
    ),
  ]);

  // Send SMS — plug in your provider (Semaphore is common for PH projects)
  for (const record of created) {
    if (!record.contact_no) continue;

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-deletion?token=${record.token}`;
    const message =
      `Kumusta ${record.full_name}, ang Barangay ay nagbe-beryipika ng mga miyembro. ` +
      `Mangyaring kumpirmahin ang iyong katayuan: ${confirmUrl}`;

    // TODO: replace with your SMS provider call, e.g.:
    // await semaphore.send({ number: record.contact_no, message, sendername: "BARANGAY" });
    console.log(`[SMS] → ${record.contact_no}: ${message}`);
  }

  return NextResponse.json({ message: `Confirmations sent to ${created.length} people.`, sent: created.length });
}


// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/superadmin/reset-db/status/route.ts
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET_STATUS(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const confirmations = await prisma.deletionConfirmation.findMany({
    orderBy: { notified_at: "desc" },
  });

  return NextResponse.json({
    confirmations: confirmations.map((c) => ({
      id:           c.record_id,
      type:         c.record_type,
      full_name:    c.full_name,
      contact_no:   c.contact_no,
      status:       c.status,
      notified_at:  c.notified_at.toISOString(),
      responded_at: c.responded_at?.toISOString() ?? null,
    })),
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
//  DELETE /api/superadmin/reset-db/purge/route.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Body: { ids: number[] }
//
// CASCADE chain (from your schema):
//   Delete User → cascades to Resident/Staff (onDelete: Cascade on user_id)
//   Delete Resident → cascades to CertificateRequest, Feedback, Clearance,
//                     DigitalID, DemographicTag, Notification (all Cascade)
//   Delete Staff → cascades to DigitalID (Cascade)
//
// So deleting the User record is all that's needed — Prisma handles the rest.
export async function DELETE_PURGE(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const { ids }: { ids: number[] } = await req.json();

  // Re-verify server-side — never trust the client alone
  const confirmed = await prisma.deletionConfirmation.findMany({
    where: { record_id: { in: ids }, status: "confirmed_departure" },
  });

  if (confirmed.length === 0) {
    return NextResponse.json({ message: "No confirmed departures to delete." }, { status: 400 });
  }

  const residentIds = confirmed.filter((c) => c.record_type === "resident").map((c) => c.record_id);
  const staffIds    = confirmed.filter((c) => c.record_type === "staff").map((c) => c.record_id);

  // Resolve user_ids for cascade deletion
  const [residentUsers, staffUsers] = await Promise.all([
    prisma.resident.findMany({
      where: { resident_id: { in: residentIds } },
      select: { user_id: true },
    }),
    prisma.staff.findMany({
      where: { staff_id: { in: staffIds } },
      select: { user_id: true },
    }),
  ]);

  const userIdsToDelete = [
    ...residentUsers.map((r) => r.user_id),
    ...staffUsers.map((s) => s.user_id),
  ];

  await prisma.$transaction(async (tx) => {
    // One delete cascades everything: Resident/Staff + all their related records
    await tx.user.deleteMany({ where: { user_id: { in: userIdsToDelete } } });
    // Clean up the confirmation records too
    await tx.deletionConfirmation.deleteMany({ where: { record_id: { in: confirmed.map((c) => c.record_id) } } });
  });

  return NextResponse.json({
    message: `Deleted ${residentIds.length} resident(s) and ${staffIds.length} staff member(s).`,
    deleted: { residents: residentIds.length, staff: staffIds.length },
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
//  PATCH /api/superadmin/reset-db/confirm/route.ts   ← PUBLIC, no auth header
// ═══════════════════════════════════════════════════════════════════════════════
// Query: ?token=<uuid>&choice=departure|staying
// Called by the /confirm-deletion page when the resident/staff makes their choice.
export async function PATCH_CONFIRM(req: NextRequest) {
  const token  = req.nextUrl.searchParams.get("token");
  const choice = req.nextUrl.searchParams.get("choice");

  if (!token || !choice || !["departure", "staying"].includes(choice)) {
    return NextResponse.json({ message: "Invalid or missing parameters." }, { status: 400 });
  }

  const record = await prisma.deletionConfirmation.findUnique({ where: { token } });

  if (!record) {
    return NextResponse.json({ message: "This link is invalid or has expired." }, { status: 404 });
  }
  if (record.status !== "pending") {
    return NextResponse.json({ message: "You have already responded to this request." }, { status: 409 });
  }

  await prisma.deletionConfirmation.update({
    where: { token },
    data: {
      status:       choice === "departure" ? "confirmed_departure" : "confirmed_staying",
      responded_at: new Date(),
    },
  });

  return NextResponse.json({
    message: choice === "departure"
      ? "Your response has been recorded. Thank you."
      : "Great! Your record has been kept. Thank you for confirming.",
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
//  /app/confirm-deletion/page.tsx  (public page — resident/staff lands here)
// ═══════════════════════════════════════════════════════════════════════════════
//
// "use client";
// import { useSearchParams } from "next/navigation";
// import { useState } from "react";
//
// export default function ConfirmDeletionPage() {
//   const token = useSearchParams().get("token");
//   const [done, setDone] = useState(false);
//   const [message, setMessage] = useState("");
//
//   const respond = async (choice: "departure" | "staying") => {
//     const res = await fetch(`/api/superadmin/reset-db/confirm?token=${token}&choice=${choice}`, { method: "PATCH" });
//     const data = await res.json();
//     setMessage(data.message);
//     setDone(true);
//   };
//
//   if (!token) return <p className="text-center mt-20">Invalid confirmation link.</p>;
//   if (done)   return <p className="text-center mt-20">{message}</p>;
//
//   return (
//     <div className="min-h-screen flex items-center justify-center p-6">
//       <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6 space-y-4 text-center">
//         <h1 className="text-xl font-bold text-slate-800">Barangay Membership Confirmation</h1>
//         <p className="text-slate-500 text-sm">Are you still a resident or staff of this barangay?</p>
//         <button onClick={() => respond("staying")}
//           className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg">
//           ✅ Yes, I am still here
//         </button>
//         <button onClick={() => respond("departure")}
//           className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg">
//           ❌ No, I am no longer part of the barangay
//         </button>
//       </div>
//     </div>
//   );
// }