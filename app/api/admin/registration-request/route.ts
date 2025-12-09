/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { RegistrationStatus, Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const requests = await prisma.registrationRequest.findMany({
      orderBy: { submitted_at: "desc" },
    });
    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Failed to fetch registration requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch registration requests", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { request_id, approve, admin_id }: { request_id: number; approve: boolean; admin_id: number } = await req.json();

    if (!request_id || typeof approve !== "boolean" || !admin_id) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const request = await prisma.registrationRequest.findUnique({ where: { request_id } });
    if (!request) return NextResponse.json({ message: "Request not found" }, { status: 404 });

    // -------------------
    // REJECT FLOW
    // -------------------
    if (!approve) {
      await prisma.registrationRequest.update({
        where: { request_id },
        data: { status: RegistrationStatus.REJECTED },
      });

      if (request.email) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          });

          const emailHtml = `
            <p>Hello ${request.first_name},</p>
            <p>Your registration request has been <strong>rejected</strong>.</p>
            <p>Thank you for your understanding.</p>
          `;

          await transporter.sendMail({
            from: `"Barangay Niugan" <${process.env.SMTP_USER}>`,
            to: request.email,
            subject: "Registration Rejected",
            html: emailHtml,
          });
        } catch (emailError) {
          console.error("Rejection email failed for", request.email, emailError);
        }
      }

      return NextResponse.json({ message: "Request rejected successfully" });
    }

    // -------------------
    // APPROVE FLOW
    // -------------------
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create a unique username
    let baseUsername = request.email ?? request.last_name ?? `user${Date.now()}`;
    let username = baseUsername;
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;

    const user = await prisma.user.create({ data: { username, password: hashedPassword, role: request.role } });

    let resident = null;
    let staff = null;
    let householdNumber: string | null = request.household_number ?? null;
    let currentHeadId: number | null = null;

    // -------------------
    // ASSIGN HOUSEHOLD
    // -------------------
    const assignHousehold = async () => {
      let householdId: number | null = null;

      // CASE 1: Head of family → create new household
      if (request.is_head_of_family) {
        const newHousehold = await prisma.household.create({
          data: { address: request.address ?? "No address provided" },
        });
        householdId = newHousehold.id;
        householdNumber = `HH-${householdId}`;
      }
      // CASE 2: Member submitted head_id
      else if (request.head_id) {
        if (request.role === Role.RESIDENT) {
          const headResident = await prisma.resident.findUnique({ where: { resident_id: request.head_id } });
          householdId = headResident?.household_id ?? null;
        } else if (request.role === Role.STAFF) {
          const headStaff = await prisma.staff.findUnique({ where: { staff_id: request.head_id } });
          householdId = headStaff?.household_id ?? null;
        }
        householdNumber = householdId ? `HH-${householdId}` : request.household_number ?? null;
        currentHeadId = request.head_id;
      }
      // CASE 3: Member submitted household_number
      else if (request.household_number) {
        const existingHousehold = await prisma.household.findFirst({
          where: { id: parseInt(request.household_number.replace(/^HH-/, "")) },
        });
        if (existingHousehold) {
          householdId = existingHousehold.id;
          householdNumber = `HH-${householdId}`;
          currentHeadId = existingHousehold.head_resident ?? existingHousehold.head_staff ?? null;
        }
      }

      return householdId;
    };

    const householdId = await assignHousehold();

    // -------------------
    // CREATE RESIDENT
    // -------------------
    if (request.role === Role.RESIDENT) {
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
          head_id: request.is_head_of_family ? null : currentHeadId,
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

      if (request.is_head_of_family && householdId && resident.resident_id) {
        await prisma.household.update({
          where: { id: householdId },
          data: { head_resident: resident.resident_id },
        });
        await prisma.resident.update({
          where: { resident_id: resident.resident_id },
          data: { head_id: resident.resident_id },
        });
        currentHeadId = resident.resident_id;
      }

      // Generate QR code only if DigitalID doesn't exist
      const qrData = JSON.stringify({ ...resident, head_id: currentHeadId }, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      );

      const existingDigitalID = await prisma.digitalID.findFirst({
        where: { resident_id: resident.resident_id },
      });

      if (!existingDigitalID) {
        const qrCode = await QRCode.toDataURL(qrData);
        await prisma.digitalID.create({
          data: {
            resident_id: resident.resident_id,
            id_number: `ID-${resident.resident_id}`,
            qr_code: qrCode,
            issued_by: admin_id,
            issued_at: new Date(),
          },
        });
      }
    }

    // -------------------
    // CREATE STAFF
    // -------------------
    else if (request.role === Role.STAFF) {
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
          head_id: request.is_head_of_family ? null : currentHeadId,
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

      if (request.is_head_of_family && householdId && staff.staff_id) {
        await prisma.household.update({
          where: { id: householdId },
          data: { head_staff: staff.staff_id },
        });
        await prisma.staff.update({
          where: { staff_id: staff.staff_id },
          data: { head_id: staff.staff_id },
        });
        currentHeadId = staff.staff_id;
      }

      // Generate QR code only if DigitalID doesn't exist
      const qrData = JSON.stringify({ ...staff, head_id: currentHeadId }, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      );

      const existingDigitalID = await prisma.digitalID.findFirst({
        where: { staff_id: staff.staff_id },
      });

      if (!existingDigitalID) {
        const qrCode = await QRCode.toDataURL(qrData);
        await prisma.digitalID.create({
          data: {
            staff_id: staff.staff_id,
            id_number: `ID-${staff.staff_id}`,
            qr_code: qrCode,
            issued_by: admin_id,
            issued_at: new Date(),
          },
        });
      }
    }

    // -------------------
    // UPDATE REGISTRATION REQUEST
    // -------------------
    await prisma.registrationRequest.update({
      where: { request_id },
      data: {
        status: RegistrationStatus.APPROVED,
        approved_by: admin_id,
        approved_at: new Date(),
        temp_password: tempPassword,
      },
    });

    // -------------------
    // SEND APPROVAL EMAIL
    // -------------------
    if (request.email) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        const emailHtml = `
          <p>Hello ${request.first_name},</p>
          <p>Your registration has been approved!</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          ${householdNumber ? `<p><strong>Household Number:</strong> ${householdNumber}</p>` : ""}
          ${request.is_head_of_family ? `<p><strong>Head ID:</strong> ${currentHeadId}</p>` : ""}
          <p>Please log in and change your password immediately.</p>
        `;

        await transporter.sendMail({
          from: `"Barangay Niugan" <${process.env.SMTP_USER}>`,
          to: request.email,
          subject: "Registration Approved",
          html: emailHtml,
        });
      } catch (emailError) {
        console.error("Approval email failed for", request.email, emailError);
      }
    }

    return NextResponse.json({
      message: "Registration approved successfully",
      userId: user.user_id,
      residentId: resident?.resident_id ?? null,
      staffId: staff?.staff_id ?? null,
      username,
      tempPassword,
      householdNumber,
      headId: request.is_head_of_family ? currentHeadId : null,
    });

  } catch (error: any) {
    console.error("Approval/Rejection failed:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json({
      message: "Operation failed",
      error: error.message,
      details: error.stack,
    }, { status: 500 });
  }
}
