// app/api/dash/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import { supabase } from "@/../lib/supabase";

const JWT_SECRET = process.env.JWT_SECRET!;
const BUCKET = process.env.SUPABASE_PUBLIC_BUCKET!;

export const config = {
  api: { bodyParser: false },
};

// --- Helpers ---
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

async function getResidentId(userId: number): Promise<number | null> {
  const resident = await prisma.resident.findFirst({
    where: { user_id: userId },
    select: { resident_id: true },
  });
  return resident?.resident_id || null;
}

function getPublicFileUrl(filePath?: string | null) {
  if (!filePath) return null;
  try {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err) {
    console.error("Error getting public URL:", err);
    return null;
  }
}

// --- GET Feedbacks & Categories ---
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "RESIDENT")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const residentId = await getResidentId(user.userId);
    if (!residentId)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const feedbacks = await prisma.feedback.findMany({
      where: { resident_id: residentId },
      include: { category: true },
      orderBy: { submitted_at: "desc" },
    });

    const formattedFeedbacks = feedbacks.map((fb) => ({
      feedback_id: fb.feedback_id,
      category_id: fb.category_id,
      status: fb.status,
      proof_file: getPublicFileUrl(fb.proof_file),
      response: fb.response,
      response_proof_file: getPublicFileUrl(fb.response_proof_file),
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

    return NextResponse.json({ feedbacks: formattedFeedbacks, categories: formattedCategories });
  } catch (err) {
    console.error("GET /api/dash/feedback failed:", err);
    return NextResponse.json({ message: "Failed to fetch feedbacks" }, { status: 500 });
  }
}

// --- POST: Submit Feedback ---
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "RESIDENT")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const residentId = await getResidentId(user.userId);
    if (!residentId)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const formData = await req.formData();
    const categoryId = parseInt(formData.get("categoryId") as string);
    const file = formData.get("file") as File;

    if (!categoryId || !file)
      return NextResponse.json({ message: "Category and file are required" }, { status: 400 });

    // Upload file to Supabase (organized by resident)
    const filePath = `${residentId}/${Date.now()}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, fileBuffer, { cacheControl: "3600", upsert: false });

    if (error || !data) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ message: "File upload failed" }, { status: 500 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        resident_id: residentId,
        category_id: categoryId,
        status: "PENDING",
        proof_file: filePath,
        submitted_at: new Date(),
      },
      include: { category: true },
    });

    const formattedFeedback = {
      ...feedback,
      proof_file: getPublicFileUrl(filePath),
      response_proof_file: null,
    };

    return NextResponse.json({ feedback: formattedFeedback });
  } catch (err) {
    console.error("POST /api/dash/feedback failed:", err);
    return NextResponse.json({ message: "Failed to submit feedback" }, { status: 500 });
  }
}