import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

const ADMIN_SECRET = process.env.ADMIN_REGISTER_KEY;

// Update this to the actual superadmin user_id in your DB
const SYSTEM_USER_ID = 1;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
  }

  const { records }: { records: { id: number; type: "resident" | "staff" }[] } = await req.json();

  if (!records || records.length === 0) {
    return NextResponse.json({ message: "No records provided." }, { status: 400 });
  }

  const residentIds = records.filter((r) => r.type === "resident").map((r) => r.id);
  const staffIds    = records.filter((r) => r.type === "staff").map((r) => r.id);

  const [residents, staffs] = await Promise.all([
    residentIds.length > 0
      ? prisma.resident.findMany({
          where: { resident_id: { in: residentIds } },
          select: { resident_id: true, first_name: true, last_name: true, contact_no: true },
        })
      : [],
    staffIds.length > 0
      ? prisma.staff.findMany({
          where: { staff_id: { in: staffIds } },
          select: { staff_id: true, first_name: true, last_name: true, contact_no: true },
        })
      : [],
  ]);

  // Remove old pending confirmations
  await prisma.deletionConfirmation.deleteMany({
    where: {
      record_id: { in: records.map((r) => r.id) },
      status: "pending",
    },
  });

  // Create fresh confirmation records with OTPs
  const created = await Promise.all([
    ...(residents as { resident_id: number; first_name: string; last_name: string; contact_no: string | null }[]).map((r) =>
      prisma.deletionConfirmation.create({
        data: {
          record_id:   r.resident_id,
          record_type: "resident",
          full_name:   `${r.first_name} ${r.last_name}`,
          contact_no:  r.contact_no ?? null,
          token:       generateOtp(),
        },
      })
    ),
    ...(staffs as { staff_id: number; first_name: string; last_name: string; contact_no: string | null }[]).map((s) =>
      prisma.deletionConfirmation.create({
        data: {
          record_id:   s.staff_id,
          record_type: "staff",
          full_name:   `${s.first_name} ${s.last_name}`,
          contact_no:  s.contact_no ?? null,
          token:       generateOtp(),
        },
      })
    ),
  ]);

  // ── Post public announcement ───────────────────────────────────────────────
  const affectedNames = created.map((c) => c.full_name).join(", ");
  const month = new Date().toLocaleDateString("en-PH", { month: "long", year: "numeric" });

  try {
    await prisma.announcement.create({
      data: {
        title:     `Membership Verification – ${month}`,
        content:   `Ang barangay ay kasalukuyang nagbe-berify ng mga aktibong miyembro para sa taong ito. Ang mga sumusunod na miyembro ay hinihiling na personal na pumunta sa barangay hall upang kumpirmahin ang kanilang katayuan at ibigay ang kanilang OTP code sa staff: ${affectedNames}. Para sa mga katanungan, makipag-ugnayan sa barangay hall.[EXP_DAYS:30]`,
        posted_by: SYSTEM_USER_ID,
        is_public: true,
      },
    });
    console.log(`[ANNOUNCEMENT] ✓ Posted for ${created.length} records`);
  } catch (err) {
    console.error("[ANNOUNCEMENT] Failed to post:", err);
  }

  return NextResponse.json({
    message: `OTPs generated for ${created.length} people. Public announcement posted. Staff can now enter OTPs as people come in.`,
    total: created.length,
  });
}