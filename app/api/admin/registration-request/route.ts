import { NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

// ✅ GET all pending registration requests
export async function GET() {
  try {
    const pendingRequests = await prisma.registrationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { submitted_at: "desc" }, // fixed field name
      select: {
        request_id: true,
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true,
        birthdate: true,
        role: true,
        submitted_at: true,
        status: true,
      },
    });

    return NextResponse.json({ pendingRequests });
  } catch (error) {
    console.error("Fetch registration requests failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch registration requests" },
      { status: 500 }
    );
  }
}

// ✅ POST approve/reject registration request
export async function POST(req: Request) {
  try {
    const { request_id, approve } = await req.json();

    const updated = await prisma.registrationRequest.update({
      where: { request_id },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
      },
    });

    return NextResponse.json({
      message: `Registration request ${
        approve ? "approved" : "rejected"
      } successfully`,
      updated,
    });
  } catch (error) {
    console.error("Update registration request failed:", error);
    return NextResponse.json(
      { message: "Failed to update registration request" },
      { status: 500 }
    );
  }
}
