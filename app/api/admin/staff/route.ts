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

// ================= GET STAFF =================
export async function GET(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || !["ADMIN", "STAFF"].includes(decoded.role)) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const staff = await prisma.staff.findMany({
      include: {
        user: {
          include: {
            _count: {
              select: {
                certificateApprovals: true,
                claimedCertificates: true,
                approvedRequests: true,
              },
            },
          },
        },
      },
      orderBy: { staff_id: "asc" },
    });

    const result = staff.map((s) => {
      const certificatesProcessed = 
        (s.user?._count?.certificateApprovals || 0) + 
        (s.user?._count?.claimedCertificates || 0);
      const registrationResolved = s.user?._count?.approvedRequests || 0;
      const performanceScore = certificatesProcessed + registrationResolved;

      return {
        ...s,
        birthdate: s.birthdate?.toISOString(),
        created_at: s.created_at?.toISOString(),
        updated_at: s.updated_at?.toISOString(),
        head_id: s.head_id != null ? String(s.head_id) : null,
        performance: { certificatesProcessed, registrationResolved, performanceScore },
        user: { user_id: s.user?.user_id, role: s.user?.role },
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ================= DELETE STAFF =================
export async function DELETE(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

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

    // Delete the user (cascade removes staff if your Prisma schema is set up that way)
    await prisma.user.delete({ where: { user_id: staff.user_id } });

    return NextResponse.json({ message: "Staff (and associated user) deleted successfully." });
  } catch (error: any) {
    console.error("Delete Staff Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
