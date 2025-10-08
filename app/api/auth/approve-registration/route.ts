import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { RegistrationStatus, Role } from "@prisma/client";

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

export async function POST(req: NextRequest) {
  try {
    const { requestId, approverId }: { requestId: number; approverId: number } = await req.json();

    // 1️⃣ Find registration request
    const request = await prisma.registrationRequest.findUnique({ where: { request_id: requestId } });
    if (!request) return NextResponse.json({ message: "Request not found" }, { status: 404 });

    if (!request.email) {
      return NextResponse.json({ message: "Cannot approve request without email" }, { status: 400 });
    }

    // 2️⃣ Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 3️⃣ Create User
    const user = await prisma.user.create({
      data: {
        username: request.email,
        password: hashedPassword,
        role: request.role,
      },
    });

    // 4️⃣ If RESIDENT, create resident record and digital ID
    let resident = null;
    if (request.role.toUpperCase() === Role.RESIDENT) {
      resident = await prisma.resident.create({
        data: {
          user_id: user.user_id,
          first_name: request.first_name,
          last_name: request.last_name,
          contact_no: request.contact_no ?? "",
          birthdate: request.birthdate,
        },
      });

      const qrCode = await QRCode.toDataURL(`user:${user.user_id}`);
      await prisma.digitalID.create({
        data: {
          resident_id: resident.resident_id,
          id_number: `ID-${user.user_id}`,
          qr_code: qrCode,
          issued_by: approverId,
        },
      });
    }

    // 5️⃣ Update registration request as approved
    await prisma.registrationRequest.update({
      where: { request_id: requestId },
      data: { status: RegistrationStatus.APPROVED, approved_by: approverId },
    });

    // 6️⃣ Send email with credentials
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

      const emailHtml = `
        <p>Hello ${request.first_name},</p>
        <p>Your registration has been approved!</p>
        <p><strong>Username:</strong> ${request.email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password immediately.</p>
      `;

      await transporter.sendMail({
        from: `"Barangay Niugan" <${process.env.SMTP_USER}>`,
        to: request.email,
        subject: "Registration Approved",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    return NextResponse.json({
      message: "Registration approved successfully",
      userId: user.user_id,
      residentId: resident?.resident_id ?? null,
    });
  } catch (error) {
    console.error("Approval failed:", error);
    return NextResponse.json(
      { message: "Approval failed", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
