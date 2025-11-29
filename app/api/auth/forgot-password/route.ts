import { NextRequest, NextResponse } from "next/server";
import { prisma } from "#/../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, household_number, new_password } = await req.json();

    if (!username || !household_number || !new_password) {
      return NextResponse.json(
        { message: "Username, household number, and new password are required" },
        { status: 400 }
      );
    }

    // Fetch user including residents and staffs
    const user = await prisma.user.findUnique({
      where: { username },
      include: { residents: true, staffs: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Check if household_number matches any resident or staff
    const residentMatch = user.residents.find(r => r.household_number === household_number);
    const staffMatch = user.staffs.find(s => s.household_number === household_number);

    if (!residentMatch && !staffMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the user's password
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { password: hashedPassword },
    });

    // Clear temp_password in RegistrationRequest if exists
    const nameMatch = residentMatch || staffMatch;
    await prisma.registrationRequest.updateMany({
      where: {
        email: null,
        first_name: nameMatch?.first_name,
        last_name: nameMatch?.last_name,
      },
      data: { temp_password: null },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Password reset failed", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
