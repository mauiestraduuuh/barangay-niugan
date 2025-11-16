import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;

// ================= HELPER: VERIFY TOKEN =================
function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

// ================= HELPER: ENSURE USER IS A STAFF =================
async function verifyStaffUser(userId: number) {
  const staff = await prisma.staff.findFirst({
    where: { user_id: userId },
  });
  return staff !== null;
}

// ==================== FETCH STAFF PROFILE ====================
export async function GET(req: NextRequest) {
  const decoded = verifyToken(req);
  if (!decoded)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (decoded.role !== "STAFF" || !(await verifyStaffUser(decoded.userId)))
    return NextResponse.json({ message: "Access denied" }, { status: 403 });

  const staff = await prisma.user.findUnique({
    where: { user_id: decoded.userId },
    select: {
      user_id: true,
      username: true,
      role: true,
      created_at: true,
      updated_at: true,
      staffs: {
        select: {
          staff_id: true,
          first_name: true,
          last_name: true,
          birthdate: true,
          gender: true,
          address: true,
          contact_no: true,
          photo_url: true,
          senior_mode: true,
          is_head_of_family: true,
          head_id: true,
          household_number: true,
          is_4ps_member: true,
          is_indigenous: true,
          is_slp_beneficiary: true,
          is_pwd: true,
          household_id: true,
          created_at: true,
        },
      },
    },
  });

  if (!staff)
    return NextResponse.json({ message: "Staff not found" }, { status: 404 });

  return NextResponse.json({ staff }, { status: 200 });
}

// ==================== UPDATE STAFF PROFILE OR PASSWORD ====================
export async function PUT(req: NextRequest) {
  const decoded = verifyToken(req);
  if (!decoded)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (decoded.role !== "STAFF" || !(await verifyStaffUser(decoded.userId)))
    return NextResponse.json({ message: "Access denied" }, { status: 403 });

  const body = await req.json();
  const {
    username,
    first_name,
    last_name,
    birthdate,
    gender,
    address,
    contact_no,
    photo_url,
    senior_mode,
    is_head_of_family,
    head_id,
    household_number,
    is_4ps_member,
    is_indigenous,
    is_slp_beneficiary,
    is_pwd,
    household_id,
  } = body;

  // -------------------- PASSWORD CHANGE --------------------
  if (body.password) {
    const staff = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!staff)
      return NextResponse.json({ message: "Staff not found" }, { status: 404 });

    const hashedPassword = await bcrypt.hash(body.password, 10);

    await prisma.user.update({
      where: { user_id: decoded.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  }

  // -------------------- PROFILE UPDATE --------------------
  if (
    !username &&
    !first_name &&
    !last_name &&
    !birthdate &&
    !gender &&
    !address &&
    !contact_no &&
    !photo_url &&
    senior_mode === undefined &&
    is_head_of_family === undefined &&
    !head_id &&
    !household_number &&
    is_4ps_member === undefined &&
    is_indigenous === undefined &&
    is_slp_beneficiary === undefined &&
    is_pwd === undefined &&
    household_id === undefined
  ) {
    return NextResponse.json(
      { message: "No update data provided" },
      { status: 400 }
    );
  }

  // Check username availability
  if (username) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser && existingUser.user_id !== decoded.userId) {
      return NextResponse.json(
        { message: "Username is already taken" },
        { status: 409 }
      );
    }
  }

  // Build staff update data object
  const staffUpdateData: any = {};
  if (first_name !== undefined) staffUpdateData.first_name = first_name;
  if (last_name !== undefined) staffUpdateData.last_name = last_name;
  if (birthdate !== undefined) staffUpdateData.birthdate = new Date(birthdate);
  if (gender !== undefined) staffUpdateData.gender = gender;
  if (address !== undefined) staffUpdateData.address = address;
  if (contact_no !== undefined) staffUpdateData.contact_no = contact_no;
  if (photo_url !== undefined) staffUpdateData.photo_url = photo_url;
  if (senior_mode !== undefined) staffUpdateData.senior_mode = senior_mode;
  if (is_head_of_family !== undefined)
    staffUpdateData.is_head_of_family = is_head_of_family;
  if (head_id !== undefined) staffUpdateData.head_id = head_id;
  if (household_number !== undefined)
    staffUpdateData.household_number = household_number;
  if (is_4ps_member !== undefined)
    staffUpdateData.is_4ps_member = is_4ps_member;
  if (is_indigenous !== undefined)
    staffUpdateData.is_indigenous = is_indigenous;
  if (is_slp_beneficiary !== undefined)
    staffUpdateData.is_slp_beneficiary = is_slp_beneficiary;
  if (is_pwd !== undefined) staffUpdateData.is_pwd = is_pwd;
  if (household_id !== undefined) staffUpdateData.household_id = household_id;

  const updatedStaff = await prisma.user.update({
    where: { user_id: decoded.userId },
    data: {
      username,
      staffs: {
        updateMany: {
          where: { user_id: decoded.userId },
          data: staffUpdateData,
        },
      },
    },
    select: {
      user_id: true,
      username: true,
      role: true,
      staffs: {
        select: {
          staff_id: true,
          first_name: true,
          last_name: true,
          birthdate: true,
          gender: true,
          address: true,
          contact_no: true,
          photo_url: true,
          senior_mode: true,
          is_head_of_family: true,
          head_id: true,
          household_number: true,
          is_4ps_member: true,
          is_indigenous: true,
          is_slp_beneficiary: true,
          is_pwd: true,
          household_id: true,
          created_at: true,
        },
      },
      updated_at: true,
    },
  });

  return NextResponse.json(
    { message: "Profile updated successfully", staff: updatedStaff },
    { status: 200 }
  );
}