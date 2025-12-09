/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Extract user info from JWT
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

// -------------------------
// GET — admin fetch all codes
// -------------------------
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const codes = await prisma.registrationCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usedBy: {
          select: {
            resident_id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error("ADMIN GET /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch registration codes." },
      { status: 500 }
    );
  }
}

// -------------------------
// POST — admin create code
// -------------------------
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // REMOVED: Staff verification check
    // if (!(await verifyStaffUser(user.userId))) {
    //   return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    // }

    const { ownerName } = await req.json();

    if (!ownerName) {
      return NextResponse.json(
        { success: false, message: "Owner name is required." },
        { status: 400 }
      );
    }

    const code = `RC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newCode = await prisma.registrationCode.create({
      data: { code, ownerName },
    });

    return NextResponse.json({ success: true, code: newCode });
  } catch (error) {
    console.error("ADMIN POST /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create registration code." },
      { status: 500 }
    );
  }
}

// -------------------------
// PUT — admin mark code as used
// -------------------------
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // REMOVED: Staff verification check
    // if (!(await verifyStaffUser(user.userId))) {
    //   return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    // }

    const { codeId, usedById } = await req.json();

    if (!codeId || !usedById) {
      return NextResponse.json(
        { success: false, message: "codeId and usedById are required." },
        { status: 400 }
      );
    }

    const updated = await prisma.registrationCode.update({
      where: { id: codeId },
      data: {
        usedById,
        isUsed: true,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("ADMIN PUT /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update registration code." },
      { status: 500 }
    );
  }
}

// -------------------------
// DELETE — admin delete ONLY unused codes
// -------------------------
export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // REMOVED: Staff verification check
    // if (!(await verifyStaffUser(user.userId))) {
    //   return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    // }

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
    console.error("ADMIN DELETE /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete registration code." },
      { status: 500 }
    );
  }
}