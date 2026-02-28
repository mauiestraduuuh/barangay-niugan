import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Extract userId from JWT token
function getUserIdFromToken(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1]; // expects "Bearer <token>"
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET: Fetch all certificate requests of logged-in resident
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findFirst({ where: { user_id: userId } });
    if (!resident)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const requests = await prisma.certificateRequest.findMany({
      where: { resident_id: resident.resident_id },
      select: {
        request_id: true,
        certificate_type: true,
        purpose: true,
        status: true,
        requested_at: true,
        approved_at: true,
        file_path: true,
        pickup_date: true,
        pickup_time: true,
        claim_code: true,
        rejection_reason: true,
        file_path: true,
      },
      orderBy: { requested_at: "desc" },
    });

    // Hide claim code if pickup details not set
    const formattedRequests = requests.map((req) => ({
      ...req,
      claim_code: req.pickup_date && req.pickup_time ? req.claim_code : null,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Error fetching certificate requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}


// POST: Submit a new certificate request
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findFirst({ where: { user_id: userId } });
    if (!resident)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const data = await req.json();
    const { certificate_type, purpose } = data;

    if (!certificate_type) {
      return NextResponse.json({ error: "Certificate type is required" }, { status: 400 });
    }

    // Prevent duplicate pending requests of same type
    const existing = await prisma.certificateRequest.findFirst({
      where: {
        resident_id: resident.resident_id,
        certificate_type,
        status: "PENDING",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending request for this certificate." },
        { status: 400 }
      );
    }

    const request = await prisma.certificateRequest.create({
      data: {
        resident_id: resident.resident_id,
        certificate_type,
        purpose: purpose || null,
      },
    });

    return NextResponse.json({
      message: "Certificate request submitted successfully.",
      request,
    });
  } catch (error) {
    console.error("Error submitting certificate request:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
