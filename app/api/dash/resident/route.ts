/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET!;
const ID_HASH_SECRET = process.env.ID_HASH_SECRET ?? "fallback-secret";

// ================= HELPER: HASH ID =================
function hashId(id: number | string | null): string | null {
  if (id === null || id === undefined) return null;
  return crypto
    .createHmac("sha256", ID_HASH_SECRET)
    .update(String(id))
    .digest("hex");
}

// Helper to get userId from JWT token
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

// Helper to safely serialize BigInt fields
function serializeResident(resident: any) {
  return {
    ...resident,
    head_id: resident.head_id !== null ? resident.head_id.toString() : null,
    household_id: resident.household_id !== null ? resident.household_id.toString() : null,
  };
}

// Helper to hash all ID fields in the response
function hashResidentIds(resident: any) {
  return {
    ...resident,
    resident_id: hashId(resident.resident_id),
    user_id: hashId(resident.user_id),
    head_id: resident.head_id !== null ? hashId(resident.head_id) : null,
    household_id: resident.household_id !== null ? hashId(resident.household_id) : null,
  };
}

// GET resident info
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findFirst({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            username: true,
            role: true,
            created_at: true,
          },
        },
        certificateRequests: true,
        feedbacks: true,
      },
    });

    if (!resident)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const serialized = serializeResident(resident);
    const hashed = hashResidentIds(serialized);

    const data = {
      ...hashed,
      photo_url: resident.photo_url,
      is_renter: resident.is_renter,
      email: resident.user?.username || null,
      role: resident.user?.role,
      account_created: resident.user?.created_at,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH change password
export async function PATCH(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { current_password, new_password } = data;

    if (!current_password || !new_password)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isValid = await bcrypt.compare(current_password, user.password);
    if (!isValid)
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { user_id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}

// PUT update resident profile
export async function PUT(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const birthdate = formData.get("birthdate") as string;
    const contact_no = formData.get("contact_no") as string;
    const address = formData.get("address") as string;
    const photo = formData.get("photo") as File | null;

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (birthdate && isNaN(new Date(birthdate).getTime())) {
      return NextResponse.json(
        { error: "Invalid birthdate format" },
        { status: 400 }
      );
    }

    let photo_url: string | undefined = undefined;

    if (photo && photo.size > 0) {
      const maxSize = 5 * 1024 * 1024;
      if (photo.size > maxSize) {
        return NextResponse.json(
          { error: "Image size must be less than 5MB" },
          { status: 400 }
        );
      }

      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
      if (!validTypes.includes(photo.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload JPEG, PNG, or WEBP image" },
          { status: 400 }
        );
      }

      try {
        const buffer = Buffer.from(await photo.arrayBuffer());
        const base64Image = buffer.toString("base64");
        const mimeType = photo.type;
        photo_url = `data:${mimeType};base64,${base64Image}`;
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to process image" },
          { status: 500 }
        );
      }
    }

    const resident = await prisma.resident.findFirst({ where: { user_id: userId } });
    if (!resident)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const updateData: any = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      birthdate: birthdate ? new Date(birthdate) : undefined,
      address: address?.trim() || null,
      contact_no: contact_no?.trim() || null,
    };

    if (photo_url !== undefined) {
      updateData.photo_url = photo_url;
    }

    const updatedResident = await prisma.resident.update({
      where: { resident_id: resident.resident_id },
      data: updateData,
    });

    // Hash IDs in the PUT response as well
    const serialized = serializeResident(updatedResident);
    return NextResponse.json(hashResidentIds(serialized));
  } catch (err) {
    console.error("Update resident error:", err);
    return NextResponse.json({ error: "Failed to update resident" }, { status: 500 });
  }
}