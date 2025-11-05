import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// --- Helper to get admin id from JWT ---
function getAdminIdFromToken(req: NextRequest): number | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    if (payload.role !== "ADMIN") return null;
    return payload.userId;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}

// --- Safe feedback serialization ---
function safeFeedback(f: any) {
  return {
    feedback_id: f.feedback_id.toString(),
    resident_id: f.resident_id.toString(),
    message: f.message,
    status: f.status,
    response: f.response,
    responded_by: f.responded_by ? f.responded_by.toString() : null, // just the admin user_id
    submitted_at: f.submitted_at?.toISOString() || null,
    responded_at: f.responded_at?.toISOString() || null,
    resident: {
      resident_id: f.resident.resident_id.toString(),
      first_name: f.resident.first_name,
      last_name: f.resident.last_name,
      contact_no: f.resident.contact_no,
    },
  };
}

// --- GET feedback list ---
export async function GET(req: NextRequest) {
  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: { submitted_at: "desc" },
      include: { resident: true }, // no need to include respondedBy relation
    });
    return NextResponse.json({ feedback: feedback.map(safeFeedback) });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json({ message: "Failed to fetch feedback" }, { status: 500 });
  }
}

// --- POST reply to feedback ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedbackId, response } = body;

    const adminId = getAdminIdFromToken(req);
    if (!adminId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const updated = await prisma.feedback.update({
      where: { feedback_id: Number(feedbackId) },
      data: {
        response,
        responded_by: adminId, // store just the admin user_id
        status: "IN_PROGRESS",
        responded_at: new Date(),
      },
      include: { resident: true },
    });

    return NextResponse.json({ message: "Reply saved", feedback: safeFeedback(updated) });
  } catch (err) {
    console.error("Error replying to feedback:", err);
    return NextResponse.json({ message: "Failed to reply" }, { status: 500 });
  }
}

// --- PUT update feedback status ---
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedbackId, status } = body;

    const adminId = getAdminIdFromToken(req);
    if (!adminId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const updated = await prisma.feedback.update({
      where: { feedback_id: Number(feedbackId) },
      data: { status },
      include: { resident: true }, // no need for respondedBy
    });

    return NextResponse.json({ message: "Status updated", feedback: safeFeedback(updated) });
  } catch (err) {
    console.error("Error updating feedback:", err);
    return NextResponse.json({ message: "Failed to update status" }, { status: 500 });
  }
}
