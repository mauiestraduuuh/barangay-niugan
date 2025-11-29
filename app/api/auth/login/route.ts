import { NextRequest, NextResponse } from "next/server";
import { prisma } from "#/../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Fetch user including residents and staffs
    const user = await prisma.user.findUnique({
      where: { username },
      include: { residents: true, staffs: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Check bcrypt password
    let isMatch = await bcrypt.compare(password, user.password);

    // Fallback: check temp_password if user is a resident/staff with null email
    let registrationRequest: any = null;
    if (!isMatch) {
      const person = user.residents[0] || user.staffs[0];
      if (person) {
        registrationRequest = await prisma.registrationRequest.findFirst({
          where: {
            email: null,
            first_name: person.first_name,
            last_name: person.last_name,
          },
        });

        if (registrationRequest?.temp_password && password === registrationRequest.temp_password) {
          isMatch = true;
        }
      }
    }

    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT
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
      const {
        resident_id,
        first_name,
        last_name,
        birthdate,
        address,
        contact_no,
        photo_url,
        household_number,
        head_id,
      } = resident;

      userInfo = {
        ...userInfo,
        resident_id,
        first_name,
        last_name,
        birthdate,
        address,
        contact_no,
        photo_url,
        household_number,
        head_id: head_id ? head_id.toString() : null, // serialize BigInt
      };

      if (registrationRequest?.temp_password) {
        userInfo.temp_password = registrationRequest.temp_password;
      }

      redirectUrl = "/dash-front/the-dash-resident";
    } else if (user.role === "STAFF" && user.staffs.length > 0) {
      const staff = user.staffs[0];
      const {
        staff_id,
        first_name,
        last_name,
        birthdate,
        address,
        contact_no,
        photo_url,
        household_number,
        head_id,
      } = staff;

      userInfo = {
        ...userInfo,
        staff_id,
        first_name,
        last_name,
        birthdate,
        address,
        contact_no,
        photo_url,
        household_number,
        head_id: head_id ? head_id.toString() : null,
      };

      if (registrationRequest?.temp_password) {
        userInfo.temp_password = registrationRequest.temp_password;
      }

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
