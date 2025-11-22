import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const ADMIN_SECRET = process.env.ADMIN_REGISTER_KEY;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    if (!ADMIN_SECRET || authHeader !== ADMIN_SECRET) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      first_name,
      last_name,
      username,
      password,
      contact_no,
    } = body;

    if (!first_name || !last_name || !username || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    const admin = await prisma.admin.create({
      data: {
        user_id: user.user_id,
        first_name,
        last_name,
        contact_no: contact_no ?? null,
        email: null,
      },
    });

    return NextResponse.json(
      { message: "Admin account created successfully", user, admin },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin registration failed:", error);
    return NextResponse.json(
      {
        message: "Admin registration failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
