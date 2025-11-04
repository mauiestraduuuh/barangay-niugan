import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import bcrypt from "bcryptjs";

//GET Admin Profile by ID 
export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const adminId = searchParams.get("id");

  //require admin ID 
  if (!adminId)
    return NextResponse.json({ message: "Admin ID required" }, { status: 400 });

  try {
    //fetch admin details 
    const admin = await prisma.user.findUnique({
      where: { user_id: Number(adminId) },
      select: { user_id: true, username: true, role: true },
    });

    if (!admin)
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });

    return NextResponse.json(admin);
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 });
  }
}

//PUT update admin profile - username and password
export async function PUT(req: NextRequest) {
  try {
    const { adminId, username, password } = await req.json();

    const updateData: any = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    //update user in database
    const updated = await prisma.user.update({
      where: { user_id: adminId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      updated,
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ message: "Profile update failed" }, { status: 500 });
  }
}
