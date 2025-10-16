import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import { FeedbackStatus } from "@prisma/client";

// Helper to get user ID from token
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromToken(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (err) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find resident by userId
    const resident = await prisma.resident.findFirst({ where: { user_id: userId } });
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    // Get all feedbacks for this resident
    const feedbacks = await prisma.feedback.findMany({
      where: { resident_id: resident.resident_id },
      orderBy: { submitted_at: "desc" },
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findFirst({ where: { user_id: userId } });
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const { message } = await req.json();
    if (!message || message.trim() === "")
      return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const newFeedback = await prisma.feedback.create({
      data: {
        resident_id: resident.resident_id,
        message,
        status: FeedbackStatus.PENDING,
      },
    });

    return NextResponse.json({ message: "Feedback submitted", feedback: newFeedback });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
