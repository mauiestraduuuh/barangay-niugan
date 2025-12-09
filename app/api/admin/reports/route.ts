import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const householdId = searchParams.get("householdId");
    const from = searchParams.get("from"); // Date range start (e.g., "2023-01-01")
    const to = searchParams.get("to");     // Date range end (e.g., "2023-12-31")

    // Helper: Build date filter for stats (only if from/to are provided and valid)
    const buildDateFilter = (dateField: string) => {
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
          return { [dateField]: { gte: fromDate, lte: toDate } };
        }
      }
      return {};
    };

    // If fetching specific household members
    if (category === "households" && householdId) {
      const household = await prisma.household.findUnique({
        where: { id: parseInt(householdId) },
        select: {
          id: true,
          address: true,
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
              gender: true,
              contact_no: true,
            },
          },
          staff_members: {
            select: {
              staff_id: true,
              first_name: true,
              last_name: true,
              gender: true,
              contact_no: true,
            },
          },
        },
      });

      if (!household) {
        return NextResponse.json({ message: "Household not found" }, { status: 404 });
      }

      return NextResponse.json({ details: [household] });
    }

    if (category) {
      let details: any[] = [];

      switch (category) {
        case "residents":
          details = await prisma.resident.findMany({
            where: buildDateFilter("created_at"), // Apply date filter
            select: {
              resident_id: true,
              first_name: true,
              last_name: true,
              birthdate: true,
              gender: true,
              contact_no: true,
              address: true,
              created_at: true,
            },
            take: 5000, // Limit for performance; adjust as needed
          });
          break;

        case "staff":
        const staffData = await prisma.staff.findMany({
          where: buildDateFilter("created_at"),
          select: {
            staff_id: true,
            first_name: true,
            last_name: true,
            birthdate: true,
            gender: true,
            contact_no: true,
            address: true,
            created_at: true,
            user: {
              select: {
                _count: {
                  select: {
                    approvedRequests: true,
                    certificateApprovals: true,
                    claimedCertificates: true,
                  },
                },
              },
            },
          },
          take: 5000,
        });

        // Flatten the nested structure
        details = staffData.map(staff => ({
          staff_id: staff.staff_id,
          first_name: staff.first_name,
          last_name: staff.last_name,
          birthdate: staff.birthdate,
          gender: staff.gender,
          contact_no: staff.contact_no,
          address: staff.address,
          created_at: staff.created_at,
          approved_requests: staff.user?._count.approvedRequests || 0,
          approved_certificates: staff.user?._count.certificateApprovals || 0,
          claimed_certificates: staff.user?._count.claimedCertificates || 0,
        }));
        break;

        case "certificates":
          details = await prisma.certificateRequest.findMany({
            where: buildDateFilter("requested_at"), // Apply date filter
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
            take: 5000,
          });
          break;

        case "feedback":
          details = await prisma.feedback.findMany({
            where: buildDateFilter("submitted_at"), // Apply date filter
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
              respondedBy: {
                select: {
                  user_id: true,
                  username: true,
                },
              },
            },
            orderBy: { submitted_at: "desc" },
            take: 5000,
          });
          break;

        case "households":
          details = await prisma.household.findMany({
            where: buildDateFilter("created_at"), // Apply date filter
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
              staff_members: {
                select: {
                  staff_id: true,
                  first_name: true,
                  last_name: true,
                },
              },
            },
            take: 5000,
          });
          break;

        case "announcements":
          details = await prisma.announcement.findMany({
            where: buildDateFilter("posted_at"), // Apply date filter
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
            take: 5000,
          });
          break;

        default:
          return NextResponse.json({ message: "Invalid category" }, { status: 400 });
      }

      return NextResponse.json({ details });
    } else {
      // ===== Summary stats with date filtering =====
      const totalResidents = await prisma.resident.count({ where: buildDateFilter("created_at") });
      const totalStaff = await prisma.staff.count({ where: buildDateFilter("created_at") });
      const totalCertificates = await prisma.certificateRequest.count({ where: buildDateFilter("requested_at") });
      const totalFeedback = await prisma.feedback.count({ where: buildDateFilter("submitted_at") });
      const totalHouseholds = await prisma.household.count({ where: buildDateFilter("created_at") });
      const totalAnnouncements = await prisma.announcement.count({ where: buildDateFilter("posted_at") });

      const stats = {
        totalResidents,
        totalStaff,
        totalCertificates,
        totalFeedback,
        totalHouseholds,
        totalAnnouncements,
      };

      return NextResponse.json({ stats });
    }
  } catch (error) {
    console.error("Fetch reports failed:", error);
    return NextResponse.json({ message: "Failed to fetch reports" }, { status: 500 });
  }
}
