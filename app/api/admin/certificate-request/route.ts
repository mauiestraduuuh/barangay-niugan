import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

// ✅ GET all certificate requests (for admin view)
export async function GET() {
  try {
    const requests = await prisma.certificateRequest.findMany({
      include: { resident: true },
      orderBy: { requested_at: "desc" },
    });

    // ✅ Serialize Dates and BigInts
    const serializedRequests = requests.map((req) => ({
      ...req,
      request_id: Number(req.request_id),
      resident_id: Number(req.resident_id),
      approved_by: req.approved_by ? Number(req.approved_by) : null,
      requested_at: req.requested_at?.toISOString(),
      approved_at: req.approved_at ? req.approved_at.toISOString() : null,
      resident: {
        ...req.resident,
        resident_id: Number(req.resident.resident_id),
        head_id: req.resident.head_id ? Number(req.resident.head_id) : null,
        birthdate: req.resident.birthdate.toISOString(),
        created_at: req.resident.created_at.toISOString(),
        updated_at: req.resident.updated_at.toISOString(),
      },
    }));

    // ✅ Return array directly
    return NextResponse.json(serializedRequests);
  } catch (error) {
    console.error("Fetch certificate requests failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// ✅ PUT approve or reject a certificate request
export async function PUT(req: NextRequest) {
  try {
    const { requestId, status, approvedBy } = await req.json();

    const updated = await prisma.certificateRequest.update({
      where: { request_id: requestId },
      data: {
        status,
        approved_by: approvedBy,
        approved_at: new Date(),
      },
    });

    return NextResponse.json({
      message: `Certificate request ${status.toLowerCase()} successfully`,
      updated,
    });
  } catch (error) {
    console.error("Update certificate request failed:", error);
    return NextResponse.json(
      { message: "Failed to update certificate request" },
      { status: 500 }
    );
  }
}
