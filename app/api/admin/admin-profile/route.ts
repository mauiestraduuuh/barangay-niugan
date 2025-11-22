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
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  return user?.role === "ADMIN";
}

// ==================== FETCH ADMIN PROFILE ====================
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyToken(req);
    if (!decoded)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const isAdmin = await verifyAdminUser(decoded.userId);
    if (!isAdmin)
      return NextResponse.json({ message: "Access denied" }, { status: 403 });

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
      select: {
        user_id: true,
        username: true,
        role: true,
        created_at: true,
        updated_at: true,
        staffs: { select: { first_name: true, last_name: true, contact_no: true, photo_url: true } },
      },
    });

    if (!user) return NextResponse.json({ message: "Admin not found" }, { status: 404 });

    const staffProfile = user.staffs[0] ?? {};
    const profile = { ...user, ...staffProfile };

    return NextResponse.json({ admin: profile }, { status: 200 });
  } catch (err) {
    console.error("GET /admin-profile error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// ==================== UPDATE ADMIN PROFILE OR PASSWORD ====================
export async function PUT(req: NextRequest) {
  try {
    const decoded = verifyToken(req);
    if (!decoded)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const isAdmin = await verifyAdminUser(decoded.userId);
    if (!isAdmin)
      return NextResponse.json({ message: "Access denied" }, { status: 403 });

    const body = await req.json();
    const { username, first_name, last_name, contact_no, password } = body;

    // -------------------- PASSWORD CHANGE --------------------
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { user_id: decoded.userId },
        data: { password: hashedPassword },
      });
      return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
    }

    // -------------------- PROFILE UPDATE --------------------
    if (!username && !first_name && !last_name && !contact_no) {
      return NextResponse.json({ message: "No update data provided" }, { status: 400 });
    }

    // Check username availability
    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.user_id !== decoded.userId) {
        return NextResponse.json({ message: "Username is already taken" }, { status: 409 });
      }
    }

  } catch (err) {
    console.error("PUT /admin-profile error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}