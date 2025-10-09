// imports (same with register)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import bcrypt from "bcryptjs"; // hashing library for passwords
import QRCode from "qrcode"; // generates qr code
import nodemailer from "nodemailer"; //sends email
import { RegistrationStatus, Role } from "@prisma/client";

// GET handler
// queries the db for all registration request with pending status
// this will be later on use for staff/admin dashboard
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
    const { requestId, approverId }: { requestId: number; approverId: number } = await req.json(); 

    // fetches the registration request, retrieves registration request from db (RegistrationRequest table)
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
        is_4ps_member: true,
        is_indigenous: true,
        is_slp_beneficiary: true,
        is_pwd: true,
        is_senior: true,
        status: true,
        approved_by: true,
        submitted_at: true,
      },
    });

    if (!request) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    // validation, prevents creating user with invalid credentials
    // ensures at least email or last name is available
    if (!request.email && !request.last_name) {
      return NextResponse.json(
        { message: "Cannot approve request without email or last name" },
        { status: 400 }
      );
    }

    // generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // use email if available, otherwise last name as username
    const username = request.email ?? request.last_name;

    // create user, inserts new table to User DB
    // uses the hashed password
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: request.role, // requested role during registration
      },
    });

    let resident = null;

    // creates resident role, if resident
    if (request.role === Role.RESIDENT) {
      resident = await prisma.resident.create({
        data: {
          user_id: user.user_id,
          first_name: request.first_name,
          last_name: request.last_name,
          contact_no: request.contact_no ?? "",
          birthdate: request.birthdate,
          gender: request.gender ?? "",
          address: request.address ?? "",
          is_head_of_family: request.is_head_of_family ?? false,
          head_id: request.head_id ?? null,
          is_4ps_member: request.is_4ps_member ?? false,
          is_pwd: request.is_pwd ?? false,
          is_indigenous: request.is_indigenous ?? false,
          is_slp_beneficiary: request.is_slp_beneficiary ?? false,
          senior_mode: request.is_senior ?? false,
          photo_url: request.photo_url ?? "",
        },
      });

      // generate QR code
      const qrData = JSON.stringify(resident);
      const qrCode = await QRCode.toDataURL(qrData);

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

    // delete registration request after approval
    await prisma.registrationRequest.delete({ where: { request_id: requestId } });

    // sends email with credentials
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

      // email message
      const emailHtml = `
        <p>Hello ${request.first_name},</p>
        <p>Your registration has been approved!</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password immediately.</p>
      `;

      await transporter.sendMail({
        from: `"Barangay Niugan" <${process.env.SMTP_USER}>`,
        to: request.email ?? "", // fallback to empty string // ?? means optional
        subject: "Registration Approved",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    // success response
    return NextResponse.json({
      message: "Registration approved successfully",
      userId: user.user_id,
      residentId: resident?.resident_id ?? null,
    });

    //error handling
  } catch (error) {
    console.error("Approval failed:", error);
    return NextResponse.json(
      { message: "Approval failed", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}