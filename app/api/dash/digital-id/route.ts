import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromToken(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

// Convert BigInt fields to string
function safeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findFirst({
      where: { user_id: userId },
      select: {
        resident_id: true,
        first_name: true,
        last_name: true,
        birthdate: true,
        address: true,
        head_id: true,
        household_id: true,
        is_4ps_member: true,
        is_pwd: true,
        senior_mode: true,
        is_slp_beneficiary: true,
        photo_url: true,
      },
    });

    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const digitalID = await prisma.digitalID.findFirst({
      where: { resident_id: resident.resident_id },
      select: {
        id: true,
        id_number: true,
        issued_at: true,
        issued_by: true,
        qr_code: true,
      },
    });

    if (!digitalID) return NextResponse.json({ error: "Digital ID not found" }, { status: 404 });

    // QR content
    const membership = [];
    if (resident.is_4ps_member) membership.push("Member of 4PS");
    if (resident.is_pwd) membership.push("PWD");
    if (resident.senior_mode) membership.push("Senior");
    if (resident.is_slp_beneficiary) membership.push("SLP Beneficiary");

    const qrContent = {
      full_name: `${resident.first_name} ${resident.last_name}`,
      id_number: `ID-${resident.resident_id}`,
      issued: digitalID.issued_at.toISOString().split("T")[0],
      issued_by_staff_id: digitalID.issued_by,
      birthdate: resident.birthdate.toISOString().split("T")[0],
      address: resident.address,
      head_id: resident.head_id?.toString() || null,
      memberships: membership, // only include if they have any
    };

    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrContent));

    const safeDigitalID = safeBigInt({
      ...digitalID,
      id_number: `ID-${resident.resident_id}`,
      qr_code: qrDataURL,
    });

    return NextResponse.json({
      digitalID: safeDigitalID,
      resident: safeBigInt(resident),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch digital ID" }, { status: 500 });
  }
}
