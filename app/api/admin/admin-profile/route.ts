import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;

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

// ================= HELPER: ENSURE USER IS AN ADMIN =================
async function verifyAdminUser(userId: number) {
  const admin = await prisma.admin.findUnique({
    where: { user_id: userId },
  });
  return admin !== null;
}

// ==================== FETCH ADMIN PROFILE ====================
export async function GET(req: NextRequest) {
  const decoded = verifyToken(req);
  if (!decoded)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (decoded.role !== "ADMIN" || !(await verifyAdminUser(decoded.userId)))
    return NextResponse.json({ message: "Access denied" }, { status: 403 });

  const admin = await prisma.user.findUnique({
    where: { user_id: decoded.userId },
    select: {
      user_id: true,
      username: true,
      role: true,
      created_at: true,
      updated_at: true,
      admin: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true,
          created_at: true,
        },
      },
    },
  });

  if (!admin)
    return NextResponse.json({ message: "Admin not found" }, { status: 404 });

  return NextResponse.json({ admin }, { status: 200 });
}

// ==================== UPDATE ADMIN PROFILE OR PASSWORD ====================
export async function PUT(req: NextRequest) {
  const decoded = verifyToken(req);
  if (!decoded)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (decoded.role !== "ADMIN" || !(await verifyAdminUser(decoded.userId)))
    return NextResponse.json({ message: "Access denied" }, { status: 403 });

  const body = await req.json();
  const { username, first_name, last_name, email, contact_no, oldPassword, newPassword } = body;

  // -------------------- PASSWORD CHANGE --------------------
if (body.password) {
  const admin = await prisma.user.findUnique({
    where: { user_id: decoded.userId },
  });

  if (!admin)
    return NextResponse.json({ message: "Admin not found" }, { status: 404 });

  // Optionally, you can skip old password check or add one
  const hashedPassword = await bcrypt.hash(body.password, 10);

  await prisma.user.update({
    where: { user_id: decoded.userId },
    data: { password: hashedPassword },
  });

  return NextResponse.json(
    { message: "Password updated successfully" },
    { status: 200 }
  );
}

  // -------------------- PROFILE UPDATE --------------------
  if (!username && !first_name && !last_name && !email && !contact_no) {
    return NextResponse.json(
      { message: "No update data provided" },
      { status: 400 }
    );
  }

  // Check username availability
  if (username) {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser && existingUser.user_id !== decoded.userId) {
      return NextResponse.json(
        { message: "Username is already taken" },
        { status: 409 }
      );
    }
  }

  // Check email availability
  if (email) {
    const existingAdminEmail = await prisma.admin.findUnique({ where: { email } });
    if (existingAdminEmail && existingAdminEmail.user_id !== decoded.userId) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 409 }
      );
    }
  }

  const updatedAdmin = await prisma.user.update({
    where: { user_id: decoded.userId },
    data: {
      username,
      admin: {
        update: {
          first_name,
          last_name,
          email,
          contact_no,
        },
      },
    },
    select: {
      user_id: true,
      username: true,
      role: true,
      admin: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true,
          created_at: true,
        },
      },
      updated_at: true,
    },
  });

  return NextResponse.json(
    { message: "Profile updated successfully", admin: updatedAdmin },
    { status: 200 }
  );
}
