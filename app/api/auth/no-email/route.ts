/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref")?.trim().toUpperCase();

    if (!ref) {
      return NextResponse.json({ message: "Reference number required" }, { status: 400 });
    }

    // Lookup registration request
    const request = await prisma.registrationRequest.findFirst({
      where: { reference_number: ref },
      select: {
        first_name: true,
        last_name: true,
        status: true,
        role: true,
        temp_password: true,
        email: true,
      },
    });

    if (!request) {
      return NextResponse.json({ message: "Reference number not found" }, { status: 404 });
    }

    const responseData: any = {
      first_name: request.first_name,
      last_name: request.last_name,
      status: request.status,
      role: request.role,
    };

    if (request.status === "APPROVED") {
      const baseUsername = request.email ?? request.last_name ?? "";

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: baseUsername },
            { username: { startsWith: baseUsername } }
          ],
          role: request.role
        },
        orderBy: { created_at: 'desc' },
        include: { residents: true, staffs: true },
      });

      if (user) {
        responseData.username = user.username;
        responseData.temp_password = request.temp_password;

        // Retrieve household number
        let householdNumber = null;
        if (user.residents.length > 0) {
          householdNumber = user.residents[0].household_number;
        } else if (user.staffs.length > 0) {
          householdNumber = user.staffs[0].household_number;
        }
        responseData.household_number = householdNumber;
      }
    }

    return NextResponse.json({ message: "Status retrieved", request: responseData });
  } catch (error) {
    console.error("Reference lookup error:", error);
    return NextResponse.json(
      { message: "Failed to fetch status", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
