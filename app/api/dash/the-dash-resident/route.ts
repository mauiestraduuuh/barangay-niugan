import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromToken(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findFirst({
      where: { user_id: userId },
      select: {
        resident_id: true,
        first_name: true,
        last_name: true,
        address: true,
        gender: true,
        photo_url: true,
        is_4ps_member: true,
        is_pwd: true,
        senior_mode: true,
      },
    });

    const announcements = await prisma.announcement.findMany({
      where: { is_public: true },
      orderBy: { posted_at: "desc" },
      take: 5,
    });

    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    return NextResponse.json({ resident, announcements, notifications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch dashboard" }, { status: 500 });
  }
}