import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ================= AUTH HELPER =================
async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    const user = await prisma.user.findUnique({ where: { user_id: decoded.userId } });
    if (!user) return null;
    return { userId: user.user_id, role: user.role };
  } catch {
    return null;
  }
}

// ================= GET REGISTRATION CODES =================
export async function GET(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || !["ADMIN", "STAFF"].includes(decoded.role)) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const codes = await prisma.registrationCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usedBy: {
          select: { resident_id: true, first_name: true, last_name: true },
        },
      },
    });

    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error("GET /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch registration codes." },
      { status: 500 }
    );
  }
}

// ================= CREATE NEW REGISTRATION CODE =================
export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || !["ADMIN", "STAFF"].includes(decoded.role)) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const { ownerName } = await req.json();
    if (!ownerName) {
      return NextResponse.json(
        { success: false, message: "Owner name is required." },
        { status: 400 }
      );
    }

    const code = `RC-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCode = await prisma.registrationCode.create({ data: { code, ownerName } });

    return NextResponse.json({ success: true, code: newCode });
  } catch (error) {
    console.error("POST /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create registration code." },
      { status: 500 }
    );
  }
}

// ================= MARK CODE AS USED =================
export async function PUT(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || !["ADMIN", "STAFF"].includes(decoded.role)) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const { codeId, usedById } = await req.json();
    if (!codeId || !usedById) {
      return NextResponse.json(
        { success: false, message: "codeId and usedById are required." },
        { status: 400 }
      );
    }

    const updated = await prisma.registrationCode.update({
      where: { id: codeId },
      data: { usedById, isUsed: true },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("PUT /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update registration code." },
      { status: 500 }
    );
  }
}

// ================= DELETE UNUSED CODE =================
export async function DELETE(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Code ID is required." },
        { status: 400 }
      );
    }

    const deleted = await prisma.registrationCode.deleteMany({
      where: { id, isUsed: false },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, message: "Cannot delete a used code." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete registration code." },
      { status: 500 }
    );
  }
}
