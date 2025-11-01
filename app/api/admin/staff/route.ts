import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      include: { user: true },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Fetch staff failed:", error);
    return NextResponse.json({ message: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { staffId } = await req.json();

    await prisma.staff.delete({ where: { staff_id: staffId } });

    return NextResponse.json({ message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Delete staff failed:", error);
    return NextResponse.json({ message: "Failed to delete staff" }, { status: 500 });
  }
}
