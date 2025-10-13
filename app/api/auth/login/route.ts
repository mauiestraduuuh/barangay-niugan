import { NextRequest, NextResponse } from "next/server"; 
import { prisma } from "#/../lib/prisma";
import bcrypt from "bcryptjs"; //previously bcrypt now bycrptjs. used for hashing password
import jwt from "jsonwebtoken"; //to generate token for authentication

//for api testing - POST request send to app/api/auth/login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    //need both username and password
    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    //to check if user exists in schema
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
  
    //compared hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    //checks if jwt_secret is in the .env file. for token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not defined in .env");
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    //generate signed token for user's id and role. expires in 2 hours matic logout.
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      secret,
      { expiresIn: "2h" }
    );

    //response in api testing (excludes password)
    return NextResponse.json({
      message: "Login successful",
      token,
      user: { id: user.user_id, role: user.role },
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Login failed", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
