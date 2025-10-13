//imports 
import { NextRequest, NextResponse } from "next/server"; //handles request and response
import { prisma } from "@/../lib/prisma"; // prisma client to interact with db
import { createClient } from "@supabase/supabase-js"; // for db storage (cloud)
import { Role, RegistrationStatus } from "@prisma/client"; // enums from db

// environment variables
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;


if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("Missing Supabase env vars (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Photo uploads will fail.");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

// handles POST request for API routes 
// we are using formData cuz it's ideal for file uploads
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // extracts input fields, this is where you add 
    // let the db lead know bout ur additional fields
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
    const is_4ps_member = String(formData.get("is_4ps_member") ?? "false") === "true";
    const is_pwd = String(formData.get("is_pwd") ?? "false") === "true";
    const is_indigenous = String(formData.get("is_indigenous") ?? "false") === "true";
    const is_slp_beneficiary = String(formData.get("is_slp_beneficiary") ?? "false") === "true";

    const photoFile = formData.get("photo") as File | null;

    // required fields 
    if (!first_name || !last_name || !contact_no || !birthdate) {
      return NextResponse.json(
        { message: "Missing required fields (first_name, last_name, contact_no, birthdate)" },
        { status: 400 }
      );
    }

    // calculates age for senior status
    const now = new Date();
    const age =
      now.getFullYear() -
      birthdate.getFullYear() -
      (now < new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate()) ? 1 : 0);
    const is_senior = age >= 60;

    // photo uploading 
    let photo_url: string | null = null;
    if (photoFile && (photoFile as any).size > 0) {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        return NextResponse.json({ message: "Server missing Supabase credentials for upload" }, { status: 500 });
      }

      const ext = (photoFile.name.split(".").pop() ?? "jpg").replace(/[^a-z0-9]/gi, "");
      const safeFileName = `resident_${Date.now()}_${first_name}_${last_name}.${ext}`.replace(/\s+/g, "_");
      const buffer = Buffer.from(await photoFile.arrayBuffer());

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(safeFileName, buffer, {
          contentType: photoFile.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json({ message: "Photo upload failed", error: uploadError.message }, { status: 500 });
      }

      const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(uploadData.path);
      photo_url = publicData.publicUrl;
    }

    // prepares table for prisma, answers go to registrationRequest table
    const createData: any = {
      first_name,
      last_name,
      email: email ?? null,
      contact_no: contact_no ?? null,
      birthdate: birthdate,
      role,
      gender,
      address,
      is_head_of_family,
      head_id,
      is_4ps_member,
      is_pwd,
      is_indigenous,
      is_slp_beneficiary,
      is_senior,
      photo_url,
      status: RegistrationStatus.PENDING, // status is set to 'pending' by default
    };

    // inserts the request db using prisma orm
    const request = await prisma.registrationRequest.create({ data: createData });

    //success response and error handling
    return NextResponse.json({ message: "Registration request submitted", request }, { status: 201 });
  } catch (err) {
    console.error("Registration failed:", err);
    return NextResponse.json(
      { message: "Registration failed", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
