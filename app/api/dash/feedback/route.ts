// app/api/dash/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: false }, // needed for formData
};

// --- GET: fetch feedbacks and complaint categories ---
export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        category: true,
      },
      orderBy: { submitted_at: "desc" },
    });

    // ✅ Include response_proof_file in the output
    const formattedFeedbacks = feedbacks.map((fb) => ({
      feedback_id: fb.feedback_id,
      category_id: fb.category_id,
      status: fb.status,
      proof_file: fb.proof_file,
      response: fb.response,
      response_proof_file: fb.response_proof_file, // NEW FIELD
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

    // For testing, assign a fake resident_id (replace with JWT later)
    const residentId = 1;

    // Create feedback
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
