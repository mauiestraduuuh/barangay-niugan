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

    console.log("Received photo file:", photo?.name, photo?.size);

    let photo_url: string | undefined = undefined;

    if (photo && photo.size > 0) {
      try {
        const buffer = Buffer.from(await photo.arrayBuffer());
        const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
        
        // Validate file type
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!validExtensions.includes(ext)) {
          return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
        }

        const filename = `${userId}_${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        // Use absolute URL path
        photo_url = `/uploads/${filename}`;
        
        console.log("Photo saved successfully:", photo_url);
      } catch (err) {
        console.error("Error saving photo:", err);
        return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
      }
    } else {
      console.log("No photo file provided or file is empty");
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

    // Only update photo_url if a new photo was uploaded
    if (photo_url !== undefined) {
      updateData.photo_url = photo_url;
      
      // Optional: Delete old photo if it exists
      if (resident.photo_url && resident.photo_url.startsWith('/uploads/')) {
        const oldPhotoPath = path.join(process.cwd(), 'public', resident.photo_url);
        if (fs.existsSync(oldPhotoPath)) {
          try {
            fs.unlinkSync(oldPhotoPath);
            console.log("Deleted old photo:", oldPhotoPath);
          } catch (err) {
            console.error("Error deleting old photo:", err);
          }
        }
      }
    }

    const updatedResident = await prisma.resident.update({
      where: { resident_id: resident.resident_id },
      data: updateData,
    });

    console.log("Updated resident photo_url:", updatedResident.photo_url);

    return NextResponse.json(serializeResident(updatedResident));
  } catch (err) {
    console.error("Error in PUT /api/dash/resident:", err);
    return NextResponse.json({ error: "Failed to update resident" }, { status: 500 });
  }
}