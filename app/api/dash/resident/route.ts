/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET!;

// Helper to get userId from JWT token
function getUserIdFromToken(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1]; // expects "Bearer <token>"
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

    const data = {
      ...serializeResident(resident),
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
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const birthdate = formData.get('birthdate') as string;
    const contact_no = formData.get('contact_no') as string;
    const address = formData.get('address') as string;
    const photo = formData.get('photo') as File | null;

    let photo_url: string | undefined = undefined;

    if (photo) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      const ext = photo.name.split('.').pop() || 'jpg'; // default to jpg if no ext
      const filename = `${userId}_${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, buffer);
      photo_url = `/uploads/${filename}`;
    }

    const resident = await prisma.resident.findFirst({ where: { user_id: userId } });
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const updateData: any = {
      first_name,
      last_name,
      birthdate: birthdate ? new Date(birthdate) : undefined,
      address,
      contact_no,
    };

    if (photo_url !== undefined) {
      updateData.photo_url = photo_url;
    }

    const updatedResident = await prisma.resident.update({
      where: { resident_id: resident.resident_id },
      data: updateData,
    });

    return NextResponse.json(serializeResident(updatedResident));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update resident" }, { status: 500 });
  }
}
