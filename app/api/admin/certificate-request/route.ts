import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

//GET all certificate requests (for admin view)
export async function GET() {
  try {
    const requests = await prisma.certificateRequest.findMany({
      include: { resident: true },
      orderBy: { requested_at: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Fetch certificate requests failed:", error);
    return NextResponse.json({ message: "Failed to fetch requests" }, { status: 500 });
  }
}

//PUT approve or reject a certificate request
export async function PUT(req: NextRequest) {
  try {
    const { requestId, status, approvedBy } = await req.json();

    //update request status
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
    return NextResponse.json({ message: "Failed to update certificate request" }, { status: 500 });
  }
}