// app/api/admin/feedback/route.ts
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
    proof_file: f.proof_file,
    status: f.status,
    response: f.response,
    responded_by: f.responded_by?.toString() || null,
    submitted_at: f.submitted_at?.toISOString() || null,
    responded_at: f.responded_at?.toISOString() || null,
    category: f.category
      ? {
          category_id: f.category.category_id.toString(),
          tagalog_name: f.category.tagalog_name,
          english_name: f.category.english_name,
          group: f.category.group || null,
        }
      : null,
    resident: f.resident
      ? {
          resident_id: f.resident.resident_id.toString(),
          first_name: f.resident.first_name,
          last_name: f.resident.last_name,
          contact_no: f.resident.contact_no,
        }
      : null,
  };
}

// --- GET feedback list + categories ---
export async function GET(req: NextRequest) {
  const adminId = getAdminIdFromToken(req);
  if (!adminId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    // Fetch feedbacks
    const feedback = await prisma.feedback.findMany({
      orderBy: { submitted_at: "desc" },
      include: { resident: true, category: true },
    });

    // Fetch complaint categories
    const categories = await prisma.complaintCategory.findMany({
      orderBy: [{ group: "asc" }, { english_name: "asc" }],
      select: { category_id: true, english_name: true, tagalog_name: true, group: true },
    });

    return NextResponse.json({
      feedback: feedback.map(safeFeedback),
      categories,
    });
  } catch (err) {
    console.error("Error fetching feedback or categories:", err);
    return NextResponse.json({ message: "Failed to fetch data" }, { status: 500 });
  }
}

// --- POST reply to feedback ---
export async function POST(req: NextRequest) {
  const adminId = getAdminIdFromToken(req);
  if (!adminId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const feedbackId = formData.get("feedbackId") as string;
    const responseText = formData.get("response") as string;

    const updated = await prisma.feedback.update({
      where: { feedback_id: Number(feedbackId) },
      data: {
        response: responseText,
        responded_by: adminId,
        status: "IN_PROGRESS",
        responded_at: new Date(),
      },
      include: { resident: true, category: true },
    });

    return NextResponse.json({ message: "Reply saved", feedback: safeFeedback(updated) });
  } catch (err) {
    console.error("Error replying to feedback:", err);
    return NextResponse.json({ message: "Failed to reply" }, { status: 500 });
  }
}

// --- PUT update feedback status ---
export async function PUT(req: NextRequest) {
  const adminId = getAdminIdFromToken(req);
  if (!adminId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { feedbackId, status } = await req.json();

    const updated = await prisma.feedback.update({
      where: { feedback_id: Number(feedbackId) },
      data: { status },
      include: { resident: true, category: true },
    });

    return NextResponse.json({ message: "Status updated", feedback: safeFeedback(updated) });
  } catch (err) {
    console.error("Error updating feedback:", err);
    return NextResponse.json({ message: "Failed to update status" }, { status: 500 });
  }
}
