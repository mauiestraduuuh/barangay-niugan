// route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { Role, RegistrationStatus } from "@prisma/client";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "Missing Supabase env vars (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Photo uploads will fail."
  );
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

// Helper to generate reference number
function generateReferenceNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REF-${yyyy}${mm}${dd}-${random}`;
}

// POST request
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const first_name = (formData.get("first_name") ?? "").toString().trim();
    const last_name = (formData.get("last_name") ?? "").toString().trim();
    const emailRaw = formData.get("email");
    const email = emailRaw ? String(emailRaw).trim() : null;
    const contact_no = (formData.get("contact_no") ?? "").toString().trim();
    const birthdateRaw = formData.get("birthdate");
    const birthdate = birthdateRaw ? new Date(String(birthdateRaw)) : null;
    const gender = formData.get("gender") ? String(formData.get("gender")) : null;
    const address = formData.get("address") ? String(formData.get("address")) : null;
    const roleRaw = formData.get("role") ? String(formData.get("role")) : "RESIDENT";
    const role = roleRaw as Role;

    const is_head_of_family = String(formData.get("is_head_of_family") ?? "false") === "true";
    const head_id = formData.get("head_id") ? Number(formData.get("head_id")) : null;
    const household_number = formData.get("household_number") ? String(formData.get("household_number")) : null;
    const is_4ps_member = String(formData.get("is_4ps_member") ?? "false") === "true";
    const is_pwd = String(formData.get("is_pwd") ?? "false") === "true";
    const is_indigenous = String(formData.get("is_indigenous") ?? "false") === "true";
    const is_slp_beneficiary = String(formData.get("is_slp_beneficiary") ?? "false") === "true";

    const photoFile = formData.get("photo") as File | null;

    // Required validation
    if (!first_name || !last_name || !contact_no || !birthdate) {
      return NextResponse.json(
        { message: "Missing required fields (first_name, last_name, contact_no, birthdate)" },
        { status: 400 }
      );
    }

    // Household number validation (only if NOT head)
    if (!is_head_of_family && household_number) {
      const numericId = Number(household_number);
      if (isNaN(numericId)) {
        return NextResponse.json({ message: "Invalid household number format. Must be numeric." }, { status: 400 });
      }
      const existingHousehold = await prisma.household.findUnique({ where: { id: numericId } });
      if (!existingHousehold) {
        return NextResponse.json({ message: "Invalid household number. No household found with this ID." }, { status: 400 });
      }
    }

    // Age → senior logic
    const now = new Date();
    const age = now.getFullYear() - birthdate.getFullYear() - (now < new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate()) ? 1 : 0);
    const is_senior = age >= 60;

    // Photo upload to Supabase
    let photo_url: string | null = null;
    if (photoFile && (photoFile as any).size > 0) {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        return NextResponse.json({ message: "Server missing Supabase credentials for upload" }, { status: 500 });
      }
      const ext = (photoFile.name.split(".").pop() ?? "jpg").replace(/[^a-z0-9]/gi, "");
      const safeFileName = `resident_${Date.now()}_${first_name}_${last_name}.${ext}`.replace(/\s+/g, "_");
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const { data: uploadData, error: uploadError } = await supabase.storage.from("uploads").upload(safeFileName, buffer, { contentType: photoFile.type || "image/jpeg", upsert: false });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json({ message: "Photo upload failed", error: uploadError.message }, { status: 500 });
      }

      const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(uploadData.path);
      photo_url = publicData.publicUrl;
    }

    // Prisma insert payload
    const createData: any = {
      first_name,
      last_name,
      email: email ?? null,
      contact_no,
      birthdate,
      role,
      gender,
      address,
      is_head_of_family,
      head_id,
      household_number,
      is_4ps_member,
      is_pwd,
      is_indigenous,
      is_slp_beneficiary,
      is_senior,
      photo_url,
      status: RegistrationStatus.PENDING,
      reference_number: generateReferenceNumber(),
    };

    // Conditional registration code for head of family
    // Conditional registration code for head of family
if (is_head_of_family) {
  const regCodeRaw = formData.get("registration_code");
  const registration_code = regCodeRaw ? String(regCodeRaw).trim() : null;

  if (!registration_code) {
    return NextResponse.json({ message: "Registration code is required for head of the family." }, { status: 400 });
  }

  const regCode = await prisma.registrationCode.findUnique({ where: { code: registration_code } });

  if (!regCode || regCode.isUsed) {
    return NextResponse.json({ message: "Invalid or already used registration code." }, { status: 400 });
  }

  // Ensure ownerName matches registrant
  const registrantFullName = `${first_name} ${last_name}`.toLowerCase().trim();
  if (regCode.ownerName.toLowerCase().trim() !== registrantFullName) {
    return NextResponse.json({ message: "This registration code does not belong to you." }, { status: 400 });
  }

  // Mark the code as used
  await prisma.registrationCode.update({
    where: { id: regCode.id },
    data: { isUsed: true },
  });
}


    // Create registration request
    const request = await prisma.registrationRequest.create({ data: createData });

    return NextResponse.json({ message: "Registration request submitted", request }, { status: 201 });

  } catch (err) {
    console.error("Registration failed:", err);
    return NextResponse.json({ message: "Registration failed", error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
