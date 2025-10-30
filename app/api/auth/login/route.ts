import { NextRequest, NextResponse } from "next/server"; 
import { prisma } from "#/../lib/prisma";
import bcrypt from "bcryptjs"; 
import jwt from "jsonwebtoken"; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { residents: true }, // fetch resident info
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not defined in .env");
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      secret,
      { expiresIn: "2h" }
    );

    let redirectUrl = "/";
    let userInfo: any = { id: user.user_id, role: user.role, username: user.username };

    if (user.role === "RESIDENT" && user.residents.length > 0) {
      const resident = user.residents[0];
      const { resident_id, first_name, last_name, birthdate, address, contact_no, photo_url } = resident;
      userInfo = { ...userInfo, resident_id, first_name, last_name, birthdate, address, contact_no, photo_url };
      redirectUrl = "/dash-front/the-dash-resident";
    } else if (user.role === "STAFF") {
      redirectUrl = "/staff-front/the-dash-staff"; 
    } else if (user.role === "ADMIN") {
      redirectUrl = "/admin-front/the-dash-admin"; 
    }

    return NextResponse.json({
      message: "Login successful",
      token,
      user: userInfo,
      redirectUrl,
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Login failed", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
