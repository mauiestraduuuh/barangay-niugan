import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

// GET – fetch all registration codes
export async function GET() {
  try {
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
    console.error("GET /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch registration codes." },
      { status: 500 }
    );
  }
}

// POST – create new registration code
export async function POST(req: NextRequest) {
  try {
    const { ownerName } = await req.json();

    if (!ownerName) {
      return NextResponse.json(
        { success: false, message: "Owner name is required." },
        { status: 400 }
      );
    }

    // Generate a unique 6-digit code (you can adjust format)
    const code = `RC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newCode = await prisma.registrationCode.create({
      data: { code, ownerName },
    });

    return NextResponse.json({ success: true, code: newCode });
  } catch (error) {
    console.error("POST /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create registration code." },
      { status: 500 }
    );
  }
}

// PUT – mark registration code as used by a resident
export async function PUT(req: NextRequest) {
  try {
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
    console.error("PUT /registration-code error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update registration code." },
      { status: 500 }
    );
  }
}

// DELETE – remove a registration code if it has NOT been used
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Code ID is required." },
        { status: 400 }
      );
    }

    // Prevent deletion if code has already been used
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
