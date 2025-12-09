/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromToken(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

// Convert BigInt fields to string
function safeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// Helper to validate and convert head_id
function isValidResidentId(id: any): number | null {
  if (!id) return null;
  
  const numId = Number(id);
  
  // Check if it's a valid number and within PostgreSQL INT4 range
  // INT4 range: -2,147,483,648 to 2,147,483,647
  if (isNaN(numId) || numId < 1 || numId > 2147483647) {
    console.warn(`Invalid head_id: ${id} (outside INT4 range)`);
    return null;
  }
  
  return numId;
}

// Helper function to get absolute photo URL
function getAbsolutePhotoUrl(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  
  // Already base64 or external URL - return as is
  if (photoUrl.startsWith("data:") || photoUrl.startsWith("http")) {
    return photoUrl;
  }
  
  // Relative path - convert to absolute URL
  if (photoUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.VERCEL_URL || 
                    'http://localhost:3000';
    return `${baseUrl}${photoUrl}`;
  }
  
  return photoUrl;
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch resident info
    const resident = await prisma.resident.findFirst({
      where: { user_id: userId },
      select: {
        resident_id: true,
        first_name: true,
        last_name: true,
        birthdate: true,
        address: true,
        household_id: true,
        household_number: true,
        is_renter: true,
        is_4ps_member: true,
        is_pwd: true,
        senior_mode: true,
        is_slp_beneficiary: true,
        photo_url: true,
      },
    });

    if (!resident)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    console.log("Resident photo_url from database:", resident.photo_url);

    // Process photo URL to absolute path
    const residentPhotoUrl = getAbsolutePhotoUrl(resident.photo_url);
    
    if (resident.photo_url) {
      if (resident.photo_url.startsWith("data:")) {
        console.log("Photo is in base64 format - ready for PDF");
      } else if (resident.photo_url.startsWith("/")) {
        console.log("Photo converted from relative to absolute:", residentPhotoUrl);
      } else if (resident.photo_url.startsWith("http")) {
        console.log("Photo is an external URL");
      }
    }

    // Determine household head using household table
    let householdHeadName = "N/A";
    if (resident.household_id) {
      try {
        // Fetch household to get head_resident or head_staff
        const household = await prisma.household.findUnique({
          where: { id: resident.household_id },
          select: { 
            head_resident: true, 
            head_staff: true 
          },
        });

        if (household) {
          // Priority: head_resident > head_staff
          const headId = household.head_resident || household.head_staff;
          
          if (headId) {
            const headIdNumber = isValidResidentId(headId);
            
            if (headIdNumber) {
              // Try to find in resident table first
              const headResident = await prisma.resident.findUnique({
                where: { resident_id: headIdNumber },
                select: { first_name: true, last_name: true },
              });
              
              if (headResident) {
                householdHeadName = `${headResident.first_name} ${headResident.last_name}`;
              } else {
                // Fallback to staff table
                const headStaff = await prisma.staff.findUnique({
                  where: { staff_id: headIdNumber },
                  select: { first_name: true, last_name: true },
                });
                
                if (headStaff) {
                  householdHeadName = `${headStaff.first_name} ${headStaff.last_name}`;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching household head from household table:", error);
        // Continue with "N/A" as default
      }
    }

    // If renter, fetch landlord info
    let landlord: any = null;
    if (resident.is_renter && resident.household_number) {
      try {
        const headResident = await prisma.resident.findFirst({
          where: { 
            household_number: resident.household_number, 
            is_head_of_family: true 
          },
          select: { 
            resident_id: true, 
            first_name: true, 
            last_name: true, 
            contact_no: true, 
            address: true 
          },
        });
        if (headResident) landlord = headResident;
      } catch (error) {
        console.error("Error fetching landlord info:", error);
      }
    }

    // Fetch Digital ID
    const digitalID = await prisma.digitalID.findFirst({
      where: { resident_id: resident.resident_id },
      select: { 
        id: true, 
        id_number: true, 
        issued_at: true, 
        issued_by: true, 
        qr_code: true 
      },
    });
    
    if (!digitalID)
      return NextResponse.json({ error: "Digital ID not found" }, { status: 404 });

    // Memberships
    const memberships: string[] = [];
    if (resident.is_4ps_member) memberships.push("Member of 4PS");
    if (resident.is_pwd) memberships.push("PWD");
    if (resident.senior_mode) memberships.push("Senior");
    if (resident.is_slp_beneficiary) memberships.push("SLP Beneficiary");
    if (resident.is_renter) memberships.push("Renter");

    // Prepare QR content
    const qrContent: any = {
      full_name: `${resident.first_name} ${resident.last_name}`,
      id_number: `ID-${resident.resident_id}`,
      issued: digitalID.issued_at.toISOString().split("T")[0],
      issued_by_staff_id: digitalID.issued_by,
      birthdate: resident.birthdate.toISOString().split("T")[0],
      address: resident.address,
      household_head: householdHeadName,
      household_number: resident.household_number?.replace(/^HH-/, "") ?? null,
      is_renter: resident.is_renter,
      memberships: memberships.length ? memberships : undefined,
    };

    // Only include landlord info if available (privacy consideration)
    if (landlord && resident.is_renter) {
      qrContent.landlord = {
        name: `${landlord.first_name} ${landlord.last_name}`,
      };
    }

    // Generate QR code
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrContent));

    const safeDigitalID = safeBigInt({
      ...digitalID,
      id_number: `ID-${resident.resident_id}`,
      qr_code: qrDataURL,
    });

    const responseData = {
      digitalID: safeDigitalID,
      resident: safeBigInt({
        ...resident,
        household_number: resident.household_number?.replace(/^HH-/, "") ?? null,
        memberships,
        photo_url: residentPhotoUrl,
      }),
      household_head: householdHeadName,
    };

    console.log("Sending photo_url to frontend:", responseData.resident.photo_url ? "Present" : "Missing");
    console.log("Household head determined from household table:", householdHeadName);

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Error in digital ID API:", err);
    return NextResponse.json({ 
      error: "Failed to fetch digital ID",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}