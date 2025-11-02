import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

// GET all feedback
export async function GET() {
  try {
    const feedback = await prisma.feedback.findMany({
      include: { resident: true, respondedBy: true },
      orderBy: { submitted_at: "desc" },
    });
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json({ message: "Failed to fetch feedback" }, { status: 500 });
  }
}

// PUT update feedback status or assign staff
export async function PUT(req: NextRequest) {
  try {
    const { feedbackId, status, staffId } = await req.json();
    const updated = await prisma.feedback.update({
      where: { feedback_id: feedbackId },
      data: { status, responded_by: staffId },
    });
    return NextResponse.json({ message: "Feedback updated", updated });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json({ message: "Failed to update feedback" }, { status: 500 });
  }
}

// POST reply to feedback
export async function POST(req: NextRequest) {
  try {
    const { feedbackId, response, responderId } = await req.json();
    const updated = await prisma.feedback.update({
      where: { feedback_id: feedbackId },
      data: { response, responded_by: responderId, responded_at: new Date(), status: "RESOLVED" },
    });
    return NextResponse.json({ message: "Feedback replied successfully", updated });
  } catch (error) {
    console.error("Error replying to feedback:", error);
    return NextResponse.json({ message: "Failed to reply" }, { status: 500 });
  }
}