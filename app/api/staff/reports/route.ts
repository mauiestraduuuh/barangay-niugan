import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Extract user ID and role from token
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

// Verify user is staff
async function verifyStaffUser(userId: number) {
  const staff = await prisma.staff.findFirst({
    where: { user_id: userId },
  });
  return staff !== null;
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await verifyStaffUser(user.userId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (category) {
      let details: any[] = [];

      switch (category) {
        case "residents":
          details = await prisma.resident.findMany({
            select: {
              resident_id: true,
              first_name: true,
              last_name: true,
              contact_no: true,
              address: true,
              created_at: true,
            },
          });
          break;

        case "staff":
          details = await prisma.staff.findMany({
            select: {
              staff_id: true,
              first_name: true,
              last_name: true,
              contact_no: true,
              address: true,
              created_at: true,
            },
          });
          break;

        case "certificates":
          details = await prisma.certificateRequest.findMany({
            select: {
              request_id: true,
              certificate_type: true,
              purpose: true,
              status: true,
              requested_at: true,
              approved_at: true,
              resident_id: true,
              resident: {
                select: {
                  resident_id: true,
                  first_name: true,
                  last_name: true,
                  contact_no: true,
                  address: true,
                },
              },
            },
            orderBy: { requested_at: "desc" },
          });
          break;

        case "feedback":
          details = await prisma.feedback.findMany({
            select: {
              feedback_id: true,
              proof_file: true,
              status: true,
              response: true,
              response_proof_file: true,
              submitted_at: true,
              responded_at: true,
              resident_id: true,
              resident: {
                select: {
                  resident_id: true,
                  first_name: true,
                  last_name: true,
                },
              },
              category: {
                select: {
                  category_id: true,
                  english_name: true,
                  tagalog_name: true,
                  group: true,
                },
              },
              responded_by: true,
            },
            orderBy: { submitted_at: "desc" },
          });
          break;

        case "households":
          details = await prisma.household.findMany({
            select: {
              id: true,
              address: true,
              created_at: true,
              headResident: {
                select: {
                  resident_id: true,
                  first_name: true,
                  last_name: true,
                },
              },
              headStaff: {
                select: {
                  staff_id: true,
                  first_name: true,
                  last_name: true,
                },
              },
              members: {
                select: {
                  resident_id: true,
                  first_name: true,
                  last_name: true,
                },
              },
            },
          });
          break;

        case "announcements":
          details = await prisma.announcement.findMany({
            select: {
              announcement_id: true,
              title: true,
              content: true,
              posted_at: true,
              is_public: true,
              postedBy: {
                select: {
                  user_id: true,
                  username: true,
                },
              },
            },
            orderBy: { posted_at: "desc" },
          });
          break;

        default:
          return NextResponse.json({ message: "Invalid category" }, { status: 400 });
      }

      return NextResponse.json({ details });
    } else {
      // REQUIREMENT E: Staff dashboard shouldn't have analytics
      // Return empty stats or minimal data
      return NextResponse.json(
        { 
          message: "Analytics not available for staff users",
          stats: null 
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Fetch reports failed:", error);
    return NextResponse.json({ message: "Failed to fetch reports" }, { status: 500 });
  }
}