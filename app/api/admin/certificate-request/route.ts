import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Extract user ID and role from token
function getUserFromToken(req: NextRequest): { userId: number; role: string } | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

// Generate a 6-digit claim code
function generateClaimCode() {
  return 'CC-' + Math.floor(100000 + Math.random() * 900000);
}

// GET: fetch all certificate requests with resident info
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.certificateRequest.findMany({
      include: {
        resident: {
          select: { resident_id: true, first_name: true, last_name: true, address: true, contact_no: true },
        },
        approvedBy: { select: { user_id: true, username: true } },
      },
      orderBy: { requested_at: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching certificate requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// PUT: handle approve/reject or schedule pickup
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { request_id, action, rejection_reason, pickup_date, pickup_time } = await req.json();

    if (!request_id || !action) {
      return NextResponse.json({ error: "request_id and action are required" }, { status: 400 });
    }

    const data: any = {};

    // Approve request (no pickup info yet)
    if (action === "APPROVE") {
      data.status = "APPROVED";
      data.approved_by = user.userId;
      data.approved_at = new Date();
    }

    // Reject request (must provide reason)
    else if (action === "REJECT") {
      if (!rejection_reason || rejection_reason.trim() === "") {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      }
      data.status = "REJECTED";
      data.rejection_reason = rejection_reason.trim();
      data.approved_by = user.userId;
      data.approved_at = new Date();
    }

    // Schedule pickup for approved request
    else if (action === "SCHEDULE_PICKUP") {
      if (!pickup_date || !pickup_time) {
        return NextResponse.json({ error: "Pickup date and time are required" }, { status: 400 });
      }
      data.pickup_date = new Date(pickup_date);
      data.pickup_time = pickup_time;
      data.claim_code = generateClaimCode();
    }

    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedRequest = await prisma.certificateRequest.update({
      where: { request_id },
      data,
    });

    return NextResponse.json({ message: "Request updated successfully", updatedRequest });
  } catch (error) {
    console.error("Error updating certificate request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
