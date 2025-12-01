/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Convert external photo URL to base64 (for the ID card only)
async function photoUrlToBase64(url: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = url.split(".").pop()?.split("?")[0] || "png";
    return `data:image/${ext};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("Failed to convert photo to base64:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch resident info
    const resident = await prisma.resident.findFirst({
      where: { user_id: userId },
      select: {
        resident_id: true,
        first_name: true,
        last_name: true,
        birthdate: true,
        address: true,
        head_id: true,
        household_number: true,
        is_renter: true,
        is_4ps_member: true,
        is_pwd: true,
        senior_mode: true,
        is_slp_beneficiary: true,
        photo_url: true,
      },
    });

    if (!resident)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    // Use base64 photo if already stored; otherwise fetch external URL
    let residentPhotoBase64: string | null = null;
    if (resident.photo_url?.startsWith("data:")) {
      residentPhotoBase64 = resident.photo_url;
    } else {
      residentPhotoBase64 = await photoUrlToBase64(resident.photo_url);
    }

    // Determine household head
    let householdHeadName = "N/A";
    if (resident.head_id) {
      const headIdNumber = Number(resident.head_id);
      const headResident = await prisma.resident.findUnique({
        where: { resident_id: headIdNumber },
        select: { first_name: true, last_name: true },
      });
      const headStaff = await prisma.staff.findUnique({
        where: { staff_id: headIdNumber },
        select: { first_name: true, last_name: true },
      });
      if (headResident) householdHeadName = `${headResident.first_name} ${headResident.last_name}`;
      else if (headStaff) householdHeadName = `${headStaff.first_name} ${headStaff.last_name}`;
    }

    // If renter, fetch landlord info
    let landlord: any = null;
    if (resident.is_renter && resident.household_number) {
      const headResident = await prisma.resident.findFirst({
        where: { household_number: resident.household_number, is_head_of_family: true },
        select: { resident_id: true, first_name: true, last_name: true, contact_no: true, address: true },
      });
      if (headResident) landlord = headResident;
    }

    // Fetch Digital ID
    const digitalID = await prisma.digitalID.findFirst({
      where: { resident_id: resident.resident_id },
      select: { id: true, id_number: true, issued_at: true, issued_by: true, qr_code: true },
    });
    if (!digitalID)
      return NextResponse.json({ error: "Digital ID not found" }, { status: 404 });

    // Memberships
    const memberships: string[] = [];
    if (resident.is_4ps_member) memberships.push("Member of 4PS");
    if (resident.is_pwd) memberships.push("PWD");
    if (resident.senior_mode) memberships.push("Senior");
    if (resident.is_slp_beneficiary) memberships.push("SLP Beneficiary");
    if (resident.is_renter) memberships.push("Renter");

    // Prepare QR content (without the photo)
    const qrContent: any = {
      full_name: `${resident.first_name} ${resident.last_name}`,
      id_number: `ID-${resident.resident_id}`,
      issued: digitalID.issued_at.toISOString().split("T")[0],
      issued_by_staff_id: digitalID.issued_by,
      birthdate: resident.birthdate.toISOString().split("T")[0],
      address: resident.address,
      household_head: householdHeadName,
      household_number: resident.household_number?.replace(/^HH-/, "") ?? null,
      is_renter: resident.is_renter,
      memberships: memberships.length ? memberships : undefined,
      landlord: landlord
        ? {
            name: `${landlord.first_name} ${landlord.last_name}`,
            contact_no: landlord.contact_no,
            address: landlord.address,
          }
        : undefined,
    };

    // Generate QR code
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrContent));

    const safeDigitalID = safeBigInt({
      ...digitalID,
      id_number: `ID-${resident.resident_id}`,
      qr_code: qrDataURL,
    });

    return NextResponse.json({
      digitalID: safeDigitalID,
      resident: safeBigInt({
        ...resident,
        household_number: resident.household_number?.replace(/^HH-/, "") ?? null,
        memberships,
        photo_url: residentPhotoBase64,
      }),
      household_head: householdHeadName,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch digital ID" }, { status: 500 });
  }
}
