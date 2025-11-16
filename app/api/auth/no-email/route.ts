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
        approvedBy: { select: { username: true, password: true } }
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

    if (request.status === "APPROVED" && request.approvedBy) {
      responseData.username = request.approvedBy.username;
      responseData.temp_password = request.approvedBy.password;
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
