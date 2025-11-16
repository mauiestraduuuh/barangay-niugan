import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";

export async function GET(req: NextRequest) {
  try {
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
      // ===== Summary stats =====
      const totalResidents = await prisma.resident.count();
      const totalStaff = await prisma.staff.count();
      const totalCertificates = await prisma.certificateRequest.count();
      const totalFeedback = await prisma.feedback.count();
      const totalHouseholds = await prisma.household.count();
      const totalAnnouncements = await prisma.announcement.count();

      // Demographic breakdown
      const demoCountsRaw = await prisma.resident.aggregate({
        _count: {
          is_4ps_member: true,
          is_indigenous: true,
          is_slp_beneficiary: true,
          is_pwd: true,
          senior_mode: true,
        },
      });

      const demographics = {
        fourPs: demoCountsRaw._count.is_4ps_member,
        indigenous: demoCountsRaw._count.is_indigenous,
        slp: demoCountsRaw._count.is_slp_beneficiary,
        pwd: demoCountsRaw._count.is_pwd,
        senior: demoCountsRaw._count.senior_mode,
      };

      const stats = {
        totalResidents,
        totalStaff,
        totalCertificates,
        totalFeedback,
        totalHouseholds,
        totalAnnouncements,
        demographics,
      };

      return NextResponse.json({ stats });
    }
  } catch (error) {
    console.error("Fetch reports failed:", error);
    return NextResponse.json({ message: "Failed to fetch reports" }, { status: 500 });
  }
}
