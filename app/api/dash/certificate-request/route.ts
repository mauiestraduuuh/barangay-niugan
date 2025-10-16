import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromToken(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1]; // expects "Bearer <token>"
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET: list all certificate requests for the logged-in resident
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findFirst({ where: { user_id: userId } });
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const requests = await prisma.certificateRequest.findMany({
      where: { resident_id: resident.resident_id },
      orderBy: { requested_at: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// POST: submit a new certificate request
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findFirst({ where: { user_id: userId } });
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const data = await req.json();
    const { certificate_type, purpose } = data;

    if (!certificate_type) {
      return NextResponse.json({ error: "Certificate type is required" }, { status: 400 });
    }

    const request = await prisma.certificateRequest.create({
      data: {
        resident_id: resident.resident_id,
        certificate_type,
        purpose: purpose || null,
      },
    });

    return NextResponse.json({ message: "Certificate request submitted", request });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
