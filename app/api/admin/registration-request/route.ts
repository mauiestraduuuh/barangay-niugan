import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { RegistrationStatus, Role } from "@prisma/client";

// Helper to generate unique head ID
function generateHeadId(): number {
  return Date.now();
}

export async function GET() {
  try {
    const requests = await prisma.registrationRequest.findMany({
      orderBy: { submitted_at: "desc" },
      select: {
        request_id: true,
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true,
        birthdate: true,
        role: true,
        submitted_at: true,
        status: true,
        approvedBy: { select: { user_id: true, username: true } },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch registration requests failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch registration requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { request_id, approve, admin_id }: { request_id: number; approve: boolean; admin_id: number } =
      await req.json();

    if (
      typeof request_id !== "number" ||
      typeof approve !== "boolean" ||
      typeof admin_id !== "number"
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const request = await prisma.registrationRequest.findUnique({
      where: { request_id },
    });

    if (!request) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    // -------------------
    // REJECT FLOW
    // -------------------
    if (!approve) {
      await prisma.registrationRequest.update({
        where: { request_id },
        data: { status: RegistrationStatus.REJECTED },
      });

      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: process.env.SMTP_PORT === "465",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        const emailHtml = `
          <p>Hello ${request.first_name},</p>
          <p>Your registration request has been <strong>rejected</strong>.</p>
          <p>Thank you for your understanding.</p>
        `;

        await transporter.sendMail({
          from: `"Barangay Niugan" <${process.env.SMTP_USER}>`,
          to: request.email ?? "",
          subject: "Registration Rejected",
          html: emailHtml,
        });
      } catch (emailError) {
        console.error("Rejection email failed:", emailError);
      }

      return NextResponse.json({ message: "Request rejected successfully" });
    }

    // -------------------
    // APPROVE FLOW
    // -------------------

    // 1️⃣ Create user account
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    let baseUsername = request.email ?? request.last_name ?? `user${Date.now()}`;
    let username = baseUsername;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
    }

    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role: request.role },
    });

    let resident = null;
    let staff = null;

    // -------------------
    // 2️⃣ Create resident or staff with household handling
    // -------------------
    if (request.role === Role.RESIDENT) {
      let householdId: number | null = null;
      let householdNumber: string | null = null;
      let headId: number | null = null;

      if (request.is_head_of_family) {
        const newHousehold = await prisma.household.create({
          data: { address: request.address ?? "No address provided" },
        });
        householdId = newHousehold.id;
        householdNumber = `HH-${newHousehold.id}`;
        headId = generateHeadId();
      } else if (request.head_id) {
        const headResident = await prisma.resident.findUnique({
          where: { resident_id: request.head_id },
        });
        householdId = headResident?.household_id ?? null;
        householdNumber = headResident?.household_id ? `HH-${headResident.household_id}` : null;
        headId = request.head_id;
      }

      resident = await prisma.resident.create({
        data: {
          user_id: user.user_id,
          first_name: request.first_name,
          last_name: request.last_name,
          contact_no: request.contact_no ?? "",
          birthdate: request.birthdate ?? new Date(0),
          gender: request.gender ?? "",
          address: request.address ?? "",
          is_head_of_family: request.is_head_of_family ?? false,
          head_id: headId,
          household_number: householdNumber,
          household_id: householdId ?? undefined,
          is_4ps_member: request.is_4ps_member ?? false,
          is_pwd: request.is_pwd ?? false,
          is_indigenous: request.is_indigenous ?? false,
          is_slp_beneficiary: request.is_slp_beneficiary ?? false,
          senior_mode: request.is_senior ?? false,
          photo_url: request.photo_url ?? "",
        },
      });

      if (request.is_head_of_family && householdId) {
        await prisma.household.update({
          where: { id: householdId },
          data: { head_resident: resident.resident_id },
        });
      }

      // Digital ID
      const qrData = JSON.stringify(resident, (_, value) => typeof value === "bigint" ? value.toString() : value);
      const qrCode = await QRCode.toDataURL(qrData);

      await prisma.digitalID.create({
        data: {
          resident_id: resident.resident_id,
          id_number: `ID-${user.user_id}`,
          qr_code: qrCode,
          issued_by: admin_id,
          issued_at: new Date(),
        },
      });
    } else if (request.role === Role.STAFF) {
      let householdId: number | null = null;
      let householdNumber: string | null = null;
      let headId: number | null = null;

      if (request.is_head_of_family) {
        const newHousehold = await prisma.household.create({
          data: { address: request.address ?? "No address provided" },
        });
        householdId = newHousehold.id;
        householdNumber = `HH-${newHousehold.id}`;
        headId = generateHeadId();
      } else if (request.head_id) {
        const headStaff = await prisma.staff.findUnique({
          where: { staff_id: request.head_id },
        });
        householdId = headStaff?.household_id ?? null;
        householdNumber = headStaff?.household_id ? `HH-${headStaff.household_id}` : null;
        headId = request.head_id;
      }

      staff = await prisma.staff.create({
        data: {
          user_id: user.user_id,
          first_name: request.first_name,
          last_name: request.last_name,
          contact_no: request.contact_no ?? "",
          birthdate: request.birthdate ?? new Date(0),
          gender: request.gender ?? "",
          address: request.address ?? "",
          is_head_of_family: request.is_head_of_family ?? false,
          head_id: headId,
          household_number: householdNumber,
          household_id: householdId ?? undefined,
          is_4ps_member: request.is_4ps_member ?? false,
          is_pwd: request.is_pwd ?? false,
          is_indigenous: request.is_indigenous ?? false,
          is_slp_beneficiary: request.is_slp_beneficiary ?? false,
          senior_mode: request.is_senior ?? false,
          photo_url: request.photo_url ?? "",
        },
      });

      if (request.is_head_of_family && householdId) {
        await prisma.household.update({
          where: { id: householdId },
          data: { head_staff: staff.staff_id },
        });
      }

      // Digital ID
      const qrData = JSON.stringify(staff, (_, value) => typeof value === "bigint" ? value.toString() : value);
      const qrCode = await QRCode.toDataURL(qrData);

      await prisma.digitalID.create({
        data: {
          staff_id: staff.staff_id,
          id_number: `ID-${user.user_id}`,
          qr_code: qrCode,
          issued_by: admin_id,
          issued_at: new Date(),
        },
      });
    }

    // -------------------
    // 3️⃣ Update registration request
    // -------------------
    await prisma.registrationRequest.update({
      where: { request_id },
      data: {
        status: RegistrationStatus.APPROVED,
        approved_by: admin_id,
        approved_at: new Date(),
      },
    });

    // -------------------
    // 4️⃣ Send approval email
    // -------------------
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === "465",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const householdNumber = resident?.household_number ?? staff?.household_number ?? null;
      const currentHeadId = resident?.head_id ?? staff?.head_id ?? null;

      const emailHtml = `
        <p>Hello ${request.first_name},</p>
        <p>Your registration has been approved!</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        ${householdNumber ? `<p><strong>Household Number:</strong> ${householdNumber}</p>` : ""}
        ${currentHeadId ? `<p><strong>Head ID:</strong> ${currentHeadId}</p>` : ""}
        <p>Please log in and change your password immediately.</p>
      `;

      await transporter.sendMail({
        from: `"Barangay Niugan" <${process.env.SMTP_USER}>`,
        to: request.email ?? "",
        subject: "Registration Approved",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Approval email failed:", emailError);
    }

    return NextResponse.json({
      message: "Registration approved successfully",
      userId: user.user_id,
      residentId: resident?.resident_id ?? null,
      staffId: staff?.staff_id ?? null,
    });
  } catch (error: any) {
    console.error("Approval/Rejection failed:", error);
    return NextResponse.json(
      { message: "Operation failed", error: error.message },
      { status: 500 }
    );
  }
}
