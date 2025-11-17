// imports (same with register)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import bcrypt from "bcryptjs"; // hashing library for passwords
import QRCode from "qrcode"; // generates qr code
import nodemailer from "nodemailer"; // sends email
import { RegistrationStatus, Role } from "@prisma/client";

// Helper functions for unique IDs
function generateHeadId(): number {
  return Date.now(); // number type to match Prisma schema
}

function generateHouseholdNumber() {
  return `HH-${Date.now()}`;
}

// GET handler
export async function GET() {
  try {
    const pendingRequests = await prisma.registrationRequest.findMany({
      where: { status: RegistrationStatus.PENDING },
    });
    return NextResponse.json(pendingRequests);
  } catch (error) {
    console.error("Failed to fetch pending registrations:", error);
    return NextResponse.json(
      { message: "Failed to fetch pending registrations", error },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(req: NextRequest) {
  try {
    const { requestId, approverId }: { requestId: number; approverId: number } =
      await req.json();

    // 1️⃣ Fetch request data
    const request = await prisma.registrationRequest.findUnique({
      where: { request_id: requestId },
      select: {
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true,
        birthdate: true,
        role: true,
        gender: true,
        address: true,
        photo_url: true,
        is_head_of_family: true,
        head_id: true,
        is_renter: true, 
        is_4ps_member: true,
        is_indigenous: true,
        is_slp_beneficiary: true,
        is_pwd: true,
        is_senior: true,
        status: true,
        temp_password: true,
        approved_by: true,
        submitted_at: true,
        household_number: true, // <-- make sure this is included
      },
    });

    if (!request) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    // 2️⃣ Validation
    if (!request.email && !request.last_name) {
      return NextResponse.json(
        { message: "Cannot approve request without email or last name" },
        { status: 400 }
      );
    }

    // 3️⃣ Create user with duplicate-check
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let baseUsername = request.email ?? request.last_name ?? `user${Date.now()}`;
    let username = baseUsername;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
    }

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: request.role,
      },
    });

    let resident = null;
    let staff = null;

    // 4️⃣ If RESIDENT
    if (request.role === Role.RESIDENT) {
      let householdId: number | null = null;
      let householdNumber: string | null = null;
      let headId: number | null = null;

      if (request.is_head_of_family) {
        const newHousehold = await prisma.household.create({
          data: { address: request.address ?? "No address provided" },
        });
        householdId = newHousehold.id;
        householdNumber = String(newHousehold.id);
        headId = generateHeadId();
      } else if (request.head_id) {
        const headResident = await prisma.resident.findUnique({
          where: { resident_id: Number(request.head_id) },
        });
        householdId = headResident?.household_id ?? null;
        householdNumber = headResident?.household_id
          ? String(headResident.household_id)
          : request.household_number ?? null; // <-- fallback to inputted household_number
        headId = Number(request.head_id);
      } else {
        // no head info, store inputted household_number
        householdNumber = request.household_number ?? null;
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
          is_renter: request.is_renter?? false,
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

      const qrData = JSON.stringify(resident, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      );
      const qrCode = await QRCode.toDataURL(qrData);

      if (resident.resident_id) {
        await prisma.digitalID.create({
          data: {
            resident_id: resident.resident_id,
            id_number: `ID-${user.user_id}`,
            qr_code: qrCode,
            issued_by: approverId,
            issued_at: new Date(),
          },
        });
      }
    }

    // 5️⃣ If STAFF
    if (request.role === Role.STAFF) {
      let householdId: number | null = null;
      let householdNumber: string | null = null;
      let headId: number | null = null;

      if (request.is_head_of_family) {
        const newHousehold = await prisma.household.create({
          data: { address: request.address ?? "No address provided" },
        });
        householdId = newHousehold.id;
        householdNumber = String(newHousehold.id);
        headId = generateHeadId();
      } else if (request.head_id) {
        const headStaff = await prisma.staff.findUnique({
          where: { staff_id: Number(request.head_id) },
        });
        householdId = headStaff?.household_id ?? null;
        householdNumber = headStaff?.household_id
          ? String(headStaff.household_id)
          : request.household_number ?? null; // <-- fallback to inputted household_number
        headId = Number(request.head_id);
      } else {
        // no head info, store inputted household_number
        householdNumber = request.household_number ?? null;
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
          is_renter: request.is_renter ?? false,
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

      const qrData = JSON.stringify(staff, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      );
      const qrCode = await QRCode.toDataURL(qrData);

      if (staff.staff_id) {
        await prisma.digitalID.create({
          data: {
            staff_id: staff.staff_id,
            id_number: `ID-${user.user_id}`,
            qr_code: qrCode,
            issued_by: approverId,
            issued_at: new Date(),
          },
        });
      }
    }

    // 6️⃣ Update registration request status
    await prisma.registrationRequest.update({
      where: { request_id: requestId },
      data: { 
        status: RegistrationStatus.APPROVED, 
        temp_password: tempPassword,
      },
        
    });

    // 7️⃣ Send email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const householdNumber =
        resident?.household_number ?? staff?.household_number ?? null;
      const headId = resident?.head_id ?? staff?.head_id ?? null;

      const emailHtml = `
        <p>Hello ${request.first_name},</p>
        <p>Your registration has been approved!</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        ${householdNumber ? `<p><strong>Household Number:</strong> ${householdNumber}</p>` : ""}
        ${headId ? `<p><strong>Head ID:</strong> ${headId}</p>` : ""}
        <p>Please log in and change your password immediately.</p>
      `;

      await transporter.sendMail({
        from: `"Barangay Niugan" <${process.env.SMTP_USER}>`,
        to: request.email ?? "",
        subject: "Registration Approved",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    // 8️⃣ Success response
    return NextResponse.json({
      message: "Registration approved successfully",

      username: username,
      tempPassword: tempPassword,
      userId: user.user_id,
      residentId: resident?.resident_id ?? null,
      staffId: staff?.staff_id ?? null,    
    });
  } catch (error: any) {
    console.error("Approval failed:", error);
    return NextResponse.json(
      {
        message: "Approval failed",
        details: error.message ?? JSON.stringify(error),
      },
      { status: 500 }
    );
  }
}
