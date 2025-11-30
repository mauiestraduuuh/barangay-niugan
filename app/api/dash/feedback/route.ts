// app/api/dash/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET!;

export const config = {
  api: { bodyParser: false }, // needed for formData
};

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

// Get resident_id from user_id
async function getResidentId(userId: number): Promise<number | null> {
  const resident = await prisma.resident.findFirst({
    where: { user_id: userId },
    select: { resident_id: true },
  });
  return resident?.resident_id || null;
}

// --- GET: fetch feedbacks and complaint categories ---
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "RESIDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residentId = await getResidentId(user.userId);
    if (!residentId) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    // Fetch only feedbacks for this resident
    const feedbacks = await prisma.feedback.findMany({
      where: { resident_id: residentId },
      include: {
        category: true,
      },
      orderBy: { submitted_at: "desc" },
    });

    const formattedFeedbacks = feedbacks.map((fb) => ({
      feedback_id: fb.feedback_id,
      category_id: fb.category_id,
      status: fb.status,
      proof_file: fb.proof_file,
      response: fb.response,
      response_proof_file: fb.response_proof_file,
      submitted_at: fb.submitted_at,
      responded_at: fb.responded_at,
      category: fb.category,
    }));

    const categories = await prisma.complaintCategory.findMany({
      orderBy: [{ group: "asc" }, { english_name: "asc" }],
    });

    const formattedCategories = categories.map((cat) => ({
      category_id: cat.category_id,
      english_name: cat.english_name,
      tagalog_name: cat.tagalog_name,
      group: cat.group,
    }));

    return NextResponse.json({
      feedbacks: formattedFeedbacks,
      categories: formattedCategories,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to fetch feedbacks" }, { status: 500 });
  }
}


// --- POST: submit new feedback ---
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = getUserFromToken(req);
    if (!user || user.role !== "RESIDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get resident_id from user_id
    const residentId = await getResidentId(user.userId);
    if (!residentId) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const categoryId = parseInt(formData.get("categoryId") as string);
    const file = formData.get("file") as File;

    if (!categoryId || !file) {
      return NextResponse.json({ message: "Category and file are required" }, { status: 400 });
    }

    // Save file to public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // Create feedback with actual resident_id
    const feedback = await prisma.feedback.create({
      data: {
        resident_id: residentId,
        category_id: categoryId,
        status: "PENDING",
        proof_file: `/uploads/${fileName}`,
        submitted_at: new Date(),
      },
      include: { category: true },
    });

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to submit feedback" }, { status: 500 });
  }
}