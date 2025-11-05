import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import fs from "fs";
import path from "path";

// Helper: serialize numbers/dates to strings for frontend
function serializeRequest(req: any) {
  return {
    ...req,
    request_id: req.request_id.toString(),
    resident_id: req.resident_id.toString(),
    approved_by: req.approved_by?.toString() ?? null,
    requested_at: req.requested_at?.toISOString(),
    approved_at: req.approved_at?.toISOString() ?? null,
    resident: {
      ...req.resident,
      resident_id: req.resident.resident_id.toString(),
      head_id: req.resident.head_id?.toString() ?? null,
      birthdate: req.resident.birthdate.toISOString(),
      created_at: req.resident.created_at.toISOString(),
      updated_at: req.resident.updated_at.toISOString(),
    },
  };
}

// ✅ GET all certificate requests
export async function GET() {
  try {
    const requests = await prisma.certificateRequest.findMany({
      include: { resident: true },
      orderBy: { requested_at: "desc" },
    });

    return NextResponse.json(requests.map(serializeRequest));
  } catch (error) {
    console.error("Fetch certificate requests failed:", error);
    return NextResponse.json({ message: "Failed to fetch requests" }, { status: 500 });
  }
}

// ✅ PUT: approve/reject a request
export async function PUT(req: NextRequest) {
  try {
    const { requestId, status, approvedBy } = await req.json();

    const updated = await prisma.certificateRequest.update({
      where: { request_id: Number(requestId) },
      data: {
        status,
        approved_by: approvedBy ? Number(approvedBy) : null,
        approved_at: new Date(),
      },
    });

    return NextResponse.json({
      message: `Certificate request ${status.toLowerCase()} successfully`,
      updated: serializeRequest(updated),
    });
  } catch (error) {
    console.error("Update certificate request failed:", error);
    return NextResponse.json({ message: "Failed to update request" }, { status: 500 });
  }
}

// ✅ POST: attach file + remarks
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const requestIdStr = formData.get("requestId")?.toString();
    const remarks = formData.get("remarks")?.toString() || undefined;
    const file = formData.get("file") as File | null;

    if (!requestIdStr) return NextResponse.json({ message: "requestId is required" }, { status: 400 });

    let filePath: string | undefined = undefined;
    if (file && file.name) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      filePath = `/uploads/${Date.now()}_${file.name}`;
      fs.writeFileSync(path.join(process.cwd(), "public", filePath), buffer);
    }

    const updated = await prisma.certificateRequest.update({
  where: { request_id: Number(requestIdStr) },
  data: {
    purpose: remarks,
    file_path: filePath,
  },
  include: { resident: true }, // << add this
});


    return NextResponse.json({
      message: "File and remarks attached successfully",
      updated: serializeRequest(updated),
    });
  } catch (error) {
    console.error("Attach file failed:", error);
    return NextResponse.json({ message: "Failed to attach file" }, { status: 500 });
  }
}
