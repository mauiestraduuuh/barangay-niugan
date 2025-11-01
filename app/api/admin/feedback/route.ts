// /api/admin/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Helper: get userId from JWT
function getUserIdFromToken(req: NextRequest): number | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

// Recursive BigInt serializer
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === "object") {
    const res: any = {};
    for (const key in obj) {
      res[key] = serializeBigInt(obj[key]);
    }
    return res;
  }
  return obj;
}

// GET: fetch all feedback
export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { submitted_at: "desc" },
      include: { resident: true },
    });

    const serialized = serializeBigInt(feedbacks); // recursively convert BigInt
    return NextResponse.json({ feedbacks: serialized });
  } catch (err) {
    console.error("Failed to fetch feedback:", err);
    return NextResponse.json(
      { message: "Failed to fetch feedback", err },
      { status: 500 }
    );
  }
}

// PUT: update status or assign staff
export async function PUT(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { feedbackId, status, assignedStaffId } = await req.json();

    const updateData: any = { status };
    if (assignedStaffId) updateData.responded_by = BigInt(assignedStaffId);

    const updated = await prisma.feedback.update({
      where: { feedback_id: BigInt(feedbackId) },
      data: updateData,
    });

    return NextResponse.json({ message: "Status updated", updated: serializeBigInt(updated) });
  } catch (err) {
    console.error("Failed to update feedback:", err);
    return NextResponse.json(
      { message: "Failed to update feedback", err },
      { status: 500 }
    );
  }
}

// POST: reply to feedback
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { feedbackId, response } = await req.json();
    const updated = await prisma.feedback.update({
      where: { feedback_id: BigInt(feedbackId) },
      data: { response, responded_by: userId, responded_at: new Date() },
    });

    return NextResponse.json({ message: "Reply sent", updated: serializeBigInt(updated) });
  } catch (err) {
    console.error("Failed to reply feedback:", err);
    return NextResponse.json(
      { message: "Failed to reply feedback", err },
      { status: 500 }
    );
  }
}
