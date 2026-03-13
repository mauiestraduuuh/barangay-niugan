import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

const ADMIN_SECRET = process.env.ADMIN_REGISTER_KEY;

// PATCH /api/superadmin/reset-db/confirm
// Body: { otp: string; choice: "departure" | "staying" }
// Called by admin after resident/staff gives them the OTP in person or by phone.

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
  }

  const { otp, choice } = await req.json();

  if (!otp || !choice || !["departure", "staying"].includes(choice)) {
    return NextResponse.json({ message: "Invalid or missing parameters." }, { status: 400 });
  }

  const record = await prisma.deletionConfirmation.findUnique({
    where: { token: otp },
  });

  if (!record) {
    return NextResponse.json({ message: "OTP not found or already used." }, { status: 404 });
  }

  if (record.status !== "pending") {
    return NextResponse.json({ message: "This OTP has already been used." }, { status: 409 });
  }

  await prisma.deletionConfirmation.update({
    where: { token: otp },
    data: {
      status:       choice === "departure" ? "confirmed_departure" : "confirmed_staying",
      responded_at: new Date(),
    },
  });

  return NextResponse.json({
    message: choice === "departure"
      ? `${record.full_name}'s departure has been confirmed.`
      : `${record.full_name} is confirmed as still active.`,
    full_name: record.full_name,
    choice,
  });
}