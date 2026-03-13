import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

const ADMIN_SECRET = process.env.ADMIN_REGISTER_KEY;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
  }

  const confirmations = await prisma.deletionConfirmation.findMany({
    orderBy: { notified_at: "desc" },
  });

  return NextResponse.json({
    confirmations: confirmations.map((c) => ({
      id:           c.record_id,
      type:         c.record_type,
      full_name:    c.full_name,
      contact_no:   c.contact_no,
      status:       c.status,
      notified_at:  c.notified_at.toISOString(),
      responded_at: c.responded_at?.toISOString() ?? null,
    })),
  });
}