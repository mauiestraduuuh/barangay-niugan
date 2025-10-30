import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;

// ==================== FETCH ADMIN PROFILE ====================
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const admin = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
      select: {
        user_id: true,
        username: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// ==================== UPDATE ADMIN PROFILE ====================
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username && !password) {
      return NextResponse.json({ message: "No update data provided" }, { status: 400 });
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedAdmin = await prisma.user.update({
      where: { user_id: decoded.userId },
      data: updateData,
      select: {
        user_id: true,
        username: true,
        role: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
