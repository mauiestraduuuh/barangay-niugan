/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import { supabase } from "@/../lib/supabase";

const JWT_SECRET = process.env.JWT_SECRET!;

// -------------------- Helpers --------------------
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

async function verifyAdminUser(userId: number) {
  const admin = await prisma.user.findFirst({ where: { user_id: userId, role: "ADMIN" } });
  return !!admin;
}

function generateClaimCode() {
  return `CC-${Math.floor(100000 + Math.random() * 900000)}`;
}

// -------------------- POST: Upload File --------------------
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await verifyAdminUser(user.userId)))
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const formData = await req.formData();
    const request_id = formData.get("request_id");
    const file = formData.get("file") as File | null;

    if (!request_id)
      return NextResponse.json({ error: "request_id is required" }, { status: 400 });

    const existingRequest = await prisma.certificateRequest.findUnique({
      where: { request_id: Number(request_id) },
    });
    if (!existingRequest)
      return NextResponse.json({ error: "Certificate request not found" }, { status: 404 });

    let filePath = existingRequest.file_path;

    if (file) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(`certificates/${fileName}`, fileBuffer, { upsert: true });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
      }

      const urlData = supabase.storage.from("uploads").getPublicUrl(`certificates/${fileName}`);
      filePath = urlData.data.publicUrl;
    }

    const updatedRequest = await prisma.certificateRequest.update({
      where: { request_id: Number(request_id) },
      data: { file_path: filePath },
    });

    return NextResponse.json({ message: "File uploaded successfully", updatedRequest });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 });
  }
}

// -------------------- GET: Fetch Requests --------------------
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await verifyAdminUser(user.userId)))
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const request = await prisma.certificateRequest.findUnique({
        where: { request_id: Number(id) },
        include: {
          resident: { select: { resident_id: true, first_name: true, last_name: true, birthdate: true, gender: true, address: true, contact_no: true } },
          approvedBy: { select: { user_id: true, username: true } },
          claimedBy: { select: { user_id: true, username: true } },
        },
      });

      if (!request)
        return NextResponse.json({ error: "Certificate request not found" }, { status: 404 });

      return NextResponse.json({ request: { ...request, file_path: request.file_path || null } });
    }

    const requests = await prisma.certificateRequest.findMany({
      include: {
        resident: { select: { resident_id: true, first_name: true, last_name: true, address: true, contact_no: true } },
        approvedBy: { select: { user_id: true, username: true } },
      },
      orderBy: { requested_at: "desc" },
    });

    const safeRequests = requests.map((r) => ({ ...r, file_path: r.file_path || null }));

    return NextResponse.json({ requests: safeRequests });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// -------------------- PUT: Update Request --------------------
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await verifyAdminUser(user.userId)))
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { request_id, action, rejection_reason, pickup_date, pickup_time } = await req.json();
    if (!request_id || !action)
      return NextResponse.json({ error: "request_id and action are required" }, { status: 400 });

    const data: any = {};

    if (action === "APPROVE") {
      data.status = "APPROVED";
      data.approved_by = user.userId;
      data.approved_at = new Date();
    } else if (action === "REJECT") {
      if (!rejection_reason || rejection_reason.trim() === "")
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      data.status = "REJECTED";
      data.rejection_reason = rejection_reason.trim();
      data.approved_by = user.userId;
      data.approved_at = new Date();
    } else if (action === "SCHEDULE_PICKUP") {
      if (!pickup_date || !pickup_time)
        return NextResponse.json({ error: "Pickup date and time are required" }, { status: 400 });
      data.pickup_date = new Date(pickup_date);
      data.pickup_time = pickup_time;
      data.claim_code = generateClaimCode();
    } else if (action === "CLAIMED") {
      data.status = "CLAIMED";
      data.claimed_at = new Date();
      data.claimed_by = user.userId;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedRequest = await prisma.certificateRequest.update({ where: { request_id }, data });
    return NextResponse.json({ message: "Request updated successfully", updatedRequest });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}