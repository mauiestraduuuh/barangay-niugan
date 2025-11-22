import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

/**
 * GET: return all staff rows (including related user)
 */
export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: true,
      },
      orderBy: { staff_id: "asc" },
    });

    // Convert BigInt / Date objects to serializable values if needed
    const result = staff.map((s) => ({
      ...s,
      // Ensure dates are serializable strings
      birthdate: s.birthdate?.toISOString(),
      created_at: s.created_at?.toISOString(),
      updated_at: s.updated_at?.toISOString(),
      // BigInt fields -> string (if any)
      head_id: s.head_id !== null && s.head_id !== undefined ? String(s.head_id) : null,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE: delete staff by staffId (also deletes associated user so no orphan rows)
 * Expects body: { staffId: number }
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const staffId = Number(body.staffId);

    if (!staffId || Number.isNaN(staffId)) {
      return NextResponse.json({ error: "Invalid staffId" }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { staff_id: staffId },
      include: { user: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Delete the user — your Prisma model uses onDelete: Cascade on the relation,
    // so deleting the user will also remove the Staff row if that's desired.
    await prisma.user.delete({
      where: { user_id: staff.user_id },
    });

    return NextResponse.json({ message: "Staff (and associated user) deleted successfully." });
  } catch (error: any) {
    console.error("Delete Staff Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
