import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET!;
const ID_HASH_SECRET = process.env.ID_HASH_SECRET ?? "fallback-secret";

// ================= HELPER: HASH ID =================
function hashId(id: number | string | null | undefined): string | null {
  if (id === null || id === undefined) return null;
  return crypto
    .createHmac("sha256", ID_HASH_SECRET)
    .update(String(id))
    .digest("hex");
}

// ================= HELPER: VERIFY TOKEN =================
function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

// ================= HELPER: ENSURE USER IS A STAFF =================
async function verifyStaffUser(userId: number) {
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  return user?.role === "STAFF";
}

// ==================== FETCH STAFF PROFILE ====================
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyToken(req);
    if (!decoded)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const isStaff = await verifyStaffUser(decoded.userId);
    if (!isStaff)
      return NextResponse.json({ message: "Access denied" }, { status: 403 });

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
      select: {
        user_id: true,
        username: true,
        role: true,
        created_at: true,
        updated_at: true,
        staffs: {
          select: {
            staff_id: true,
            first_name: true,
            last_name: true,
            contact_no: true,
            photo_url: true,
            gender: true,
            address: true,
            birthdate: true,
          },
        },
      },
    });

    if (!user)
      return NextResponse.json({ message: "Staff not found" }, { status: 404 });

    const staffProfile = user.staffs[0] ?? {};
    const { user_id, ...userWithoutId } = user;
    const { staff_id, ...staffWithoutId } = staffProfile as any;

    const profile = {
      ...userWithoutId,
      ...staffWithoutId,
      user_id: hashId(user_id),
      staff_id: hashId(staff_id),
    };

    return NextResponse.json({ staff: profile }, { status: 200 });
  } catch (err) {
    console.error("GET /staff-profile error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// ==================== UPDATE STAFF PROFILE OR PASSWORD ====================
export async function PUT(req: NextRequest) {
  try {
    const decoded = verifyToken(req);
    if (!decoded)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const isStaff = await verifyStaffUser(decoded.userId);
    if (!isStaff)
      return NextResponse.json({ message: "Access denied" }, { status: 403 });

    const body = await req.json();
    const { username, first_name, last_name, contact_no, gender, address, password, current_password } = body;

    // -------------------- PASSWORD CHANGE --------------------
    if (password !== undefined) {
      if (!password || password.trim() === "") {
        return NextResponse.json({ message: "New password cannot be empty" }, { status: 400 });
      }

      if (!current_password || current_password.trim() === "") {
        return NextResponse.json({ message: "Current password is required" }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { user_id: decoded.userId },
        select: { user_id: true, password: true },
      });

      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
      }

      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { message: "New password must be different from current password" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { user_id: decoded.userId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
    }

    // -------------------- PROFILE UPDATE --------------------
    if (!username && !first_name && !last_name && !contact_no && !gender && !address) {
      return NextResponse.json({ message: "No update data provided" }, { status: 400 });
    }

    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.user_id !== decoded.userId) {
        return NextResponse.json({ message: "Username is already taken" }, { status: 409 });
      }
    }

    const staffUpdateData: any = {};
    if (first_name) staffUpdateData.first_name = first_name;
    if (last_name) staffUpdateData.last_name = last_name;
    if (contact_no) staffUpdateData.contact_no = contact_no;
    if (gender) staffUpdateData.gender = gender;
    if (address) staffUpdateData.address = address;

    await prisma.user.update({
      where: { user_id: decoded.userId },
      data: {
        username,
        staffs: {
          updateMany: {
            where: { user_id: decoded.userId },
            data: staffUpdateData,
          },
        },
      },
    });

    return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
  } catch (err) {
    console.error("PUT /staff-profile error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}