import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, email, contact_no, role, birthdate } = await req.json();

    if (!first_name || !last_name || !contact_no || !role || !birthdate) {
      return NextResponse.json(
        { message: "Missing required fields (email is optional)" },
        { status: 400 }
      );
    }

    const request = await prisma.registrationRequest.create({
      data: {
        first_name,
        last_name,
        email: email || null,       
        contact_no,                
        birthdate: new Date(birthdate),
        role,
        status: "PENDING",
      }, // bypass TS not good for long term
    });

    return NextResponse.json({ message: "Registration request submitted", request });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      { message: "Registration failed", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
