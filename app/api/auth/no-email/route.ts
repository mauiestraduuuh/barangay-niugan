/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import { Role, RegistrationStatus } from "@prisma/client";

// Helper → Generate Reference Number
function generateReferenceNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REF-${yyyy}${mm}${dd}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      first_name,
      last_name,
      contact_no,
      birthdate,
      gender,
      address,
      role = "RESIDENT",
      is_head_of_family = false,
      head_id = null,
      household_number = null,
      is_4ps_member = false,
      is_pwd = false,
      is_indigenous = false,
      is_slp_beneficiary = false,
    } = body;

    // Required fields check
    if (!first_name || !last_name || !contact_no || !birthdate) {
      return NextResponse.json(
        { message: "Missing required fields (first_name, last_name, contact_no, birthdate)" },
        { status: 400 }
      );
    }

    // Household validation (if NOT head)
    if (!is_head_of_family && household_number) {
      const n = Number(household_number);
      if (isNaN(n)) {
        return NextResponse.json(
          { message: "Household number must be numeric" },
          { status: 400 }
        );
      }

      const exists = await prisma.household.findUnique({ where: { id: n } });
      if (!exists) {
        return NextResponse.json(
          { message: "Invalid household_number — household not found" },
          { status: 400 }
        );
      }
    }

    // Determine senior automatically
    const birth = new Date(birthdate);
    const now = new Date();
    const age =
      now.getFullYear() -
      birth.getFullYear() -
      (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);

    const is_senior = age >= 60;

    // Generate reference number
    const reference_number = generateReferenceNumber();

    // Insert registration request
    const request = await prisma.registrationRequest.create({
      data: {
        first_name,
        last_name,
        email: null, // NO EMAIL
        contact_no,
        birthdate: birth,
        role: role as Role,
        gender,
        address,
        is_head_of_family,
        head_id,
        household_number,
        is_4ps_member,
        is_pwd,
        is_indigenous,
        is_slp_beneficiary,
        is_senior,
        photo_url: null,
        status: RegistrationStatus.PENDING,
        reference_number,
      },
    });

    return NextResponse.json(
      {
        message: "Registration submitted without email",
        reference_number,
        request,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("No-email registration failed:", error);
    return NextResponse.json(
      {
        message: "Registration failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET → check status using reference number
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json(
        { message: "Reference number required" },
        { status: 400 }
      );
    }

    const request = await prisma.registrationRequest.findUnique({
      where: { reference_number: ref },
      select: {
        request_id: true,
        first_name: true,
        last_name: true,
        status: true,
        role: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { message: "Reference number not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Status retrieved",
      request,
    });
  } catch (error) {
    console.error("Reference lookup error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch status",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
