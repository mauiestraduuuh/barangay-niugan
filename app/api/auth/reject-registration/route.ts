import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import { RegistrationStatus } from "@prisma/client";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { requestId, reason }: { requestId: number; reason?: string } = await req.json();

    // find the request
    const request = await prisma.registrationRequest.findUnique({
      where: { request_id: requestId },
      select: { first_name: true, email: true },
    });

    if (!request) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    // update status to REJECTED
    await prisma.registrationRequest.update({
      where: { request_id: requestId },
      data: { status: RegistrationStatus.REJECTED },
    });

    // send rejection email
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
        <p>We regret to inform you that your registration request has been <strong>rejected</strong>.</p>
        ${
          reason
            ? `<p><strong>Reason:</strong> ${reason}</p>`
            : `<p>If you believe this was a mistake, you may reapply with the correct details.</p>`
        }
        <p>Thank you for your understanding.</p>
      `;

      await transporter.sendMail({
        from: `"Barangay Niugan" <${process.env.SMTP_USER}>`,
        to: request.email ?? "",
        subject: "Registration Rejected",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Email sending failed (rejection notice):", emailError);
    }

    return NextResponse.json({ message: "Registration rejected successfully" });
  } catch (error) {
    console.error("Rejection failed:", error);
    return NextResponse.json(
      {
        message: "Rejection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
