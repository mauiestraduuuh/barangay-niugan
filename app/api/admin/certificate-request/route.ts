// /api/admin/certificate-request.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import formidable from "formidable";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET!;

// Helper to get user from JWT
function getUserIdFromToken(req: NextRequest): number | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (err) {
    return null;
  }
}

// ------------------------
// GET: Fetch all certificate requests
// ------------------------
export async function GET() {
  try {
    const requests = await prisma.certificateRequest.findMany({
      orderBy: { requested_at: "desc" },
      include: { resident: true, approvedBy: true },
    });

    // Serialize BigInt and Date
    const safeRequests = requests.map((req) => ({
      ...req,
      request_id: req.request_id.toString(),
      resident_id: req.resident_id.toString(),
      approved_by: req.approved_by?.toString() ?? null,
      approved_at: req.approved_at?.toISOString() ?? null,
      requested_at: req.requested_at.toISOString(),
      resident: {
        ...req.resident,
        resident_id: req.resident.resident_id.toString(),
        user_id: req.resident.user_id.toString(),
        birthdate: req.resident.birthdate.toISOString(),
        head_id: req.resident.head_id?.toString() ?? null,
      },
    }));

    return NextResponse.json({ requests: safeRequests });
  } catch (error) {
    console.error("Failed to fetch certificate requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificate requests", error },
      { status: 500 }
    );
  }
}

// ------------------------
// PUT: Approve or reject a certificate request
// ------------------------
export async function PUT(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { requestId, status, remarks } = await req.json();
    if (!["APPROVED", "REJECTED"].includes(status))
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });

    const updated = await prisma.certificateRequest.update({
      where: { request_id: Number(requestId) },
      data: {
        status,
        approved_by: userId,
        approved_at: status === "APPROVED" ? new Date() : null,
        purpose: remarks ?? undefined,
      },
    });

    return NextResponse.json({ message: "Certificate request updated", updated });
  } catch (error) {
    console.error("Failed to update certificate request:", error);
    return NextResponse.json(
      { message: "Failed to update certificate request", error },
      { status: 500 }
    );
  }
}

// ------------------------
// POST: Upload or attach certificate file
// ------------------------
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise<NextResponse>((resolve) => {
    form.parse(req, async (err, fields, files: any) => {
      if (err) {
        console.error("File upload error:", err);
        return resolve(NextResponse.json({ message: "File upload failed" }, { status: 500 }));
      }

      const requestId = Number(fields.requestId);
      let filePath: string | undefined;

      if (files?.file) {
        const file = files.file;

        // Ensure uploads folder exists
        const uploadDir = "./uploads/certificates";
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const uploadPath = `${uploadDir}/${Date.now()}_${file.originalFilename}`;
        fs.renameSync(file.filepath, uploadPath);
        filePath = uploadPath;
      }

      try {
        const updated = await prisma.certificateRequest.update({
          where: { request_id: requestId },
          data: { file_path: filePath },
        });
        resolve(NextResponse.json({ message: "File attached", updated }));
      } catch (error) {
        console.error("Failed to attach file:", error);
        resolve(NextResponse.json({ message: "Failed to attach file", error }, { status: 500 }));
      }
    });
  });
}
