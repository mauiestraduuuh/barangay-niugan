import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import nodemailer from "nodemailer";

const ADMIN_SECRET    = process.env.ADMIN_REGISTER_KEY;
const SYSTEM_USER_ID  = 1;

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  // ── Send emails via RegistrationRequest (only source of emails) ───────────
  const emailResults = { sent: 0, skipped: 0, failed: 0 };

  for (const record of created) {
    // Look up email from RegistrationRequest by matching full name
    const nameParts  = record.full_name.trim().split(" ");
    const first_name = nameParts[0];
    const last_name  = nameParts.slice(1).join(" ");

    const regRequest = await prisma.registrationRequest.findFirst({
      where: {
        first_name: { equals: first_name, mode: "insensitive" },
        last_name:  { equals: last_name,  mode: "insensitive" },
        status:     "APPROVED",
      },
      select: { email: true },
    });

    const email = regRequest?.email ?? null;

    if (!email) {
      emailResults.skipped++;
      console.log(`[EMAIL] Skipped ${record.full_name} — no email found`);
      continue;
    }

    try {
      await transporter.sendMail({
        from:    `"Barangay Niugan" <${process.env.SMTP_USER}>`,
        to:      email,
        subject: "Barangay Membership Verification – Action Required",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#1a3a2a;margin-bottom:4px;">Barangay Niugan</h2>
            <p style="color:#6b7280;font-size:13px;margin-top:0;">Membership Verification</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;" />
            <p>Kumusta <strong>${record.full_name}</strong>,</p>
            <p>Ang barangay ay nagbe-berify ng mga aktibong miyembro ngayong taon.
               Mangyaring pumunta sa barangay hall at ibigay ang iyong OTP code sa staff upang kumpirmahin ang iyong katayuan.</p>
            <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
              <p style="margin:0;font-size:13px;color:#6b7280;">Iyong OTP Code</p>
              <p style="margin:8px 0 0;font-size:40px;font-weight:bold;letter-spacing:10px;color:#1a3a2a;">
                ${record.token}
              </p>
            </div>
            <p style="font-size:13px;color:#6b7280;">
              Ibigay lamang ang code na ito sa barangay staff. Huwag ibahagi sa iba.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
            <p style="font-size:12px;color:#9ca3af;">Barangay Niugan Management System</p>
          </div>
        `,
      });
      emailResults.sent++;
      console.log(`[EMAIL] ✓ Sent to ${email} (${record.full_name})`);
    } catch (err) {
      emailResults.failed++;
      console.error(`[EMAIL] Failed for ${email} (${record.full_name}):`, err);
    }
  }

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
    message: `OTPs generated for ${created.length} people. Emails: ${emailResults.sent} sent, ${emailResults.skipped} skipped, ${emailResults.failed} failed. Announcement posted.`,
    total:        created.length,
    emailResults,
  });
}