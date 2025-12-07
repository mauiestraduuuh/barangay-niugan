import { NextRequest, NextResponse } from "next/server";
import { prisma } from "#/../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, household_number, new_password } = await req.json();

    // Validate input
    if (!username || !household_number || !new_password) {
      return NextResponse.json(
        { message: "Username, household number, and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength (optional but recommended)
    if (new_password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Fetch user including residents and staffs
    const user = await prisma.user.findUnique({
      where: { username },
      include: { residents: true, staffs: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found or invalid credentials" },
        { status: 404 }
      );
    }

    // Check if household_number matches any resident or staff
    const residentMatch = user.residents.find(r => r.household_number === household_number);
    const staffMatch = user.staffs.find(s => s.household_number === household_number);

    if (!residentMatch && !staffMatch) {
      return NextResponse.json(
        { message: "Household number does not match" },
        { status: 401 }
      );
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
    if (nameMatch) {
      await prisma.registrationRequest.updateMany({
        where: {
          email: null,
          first_name: nameMatch.first_name,
          last_name: nameMatch.last_name,
        },
        data: { temp_password: null },
      });
    }

    console.log(`✅ Password reset successful for user: ${username}`);

    return NextResponse.json({ 
      message: "Password reset successfully. You can now login with your new password." 
    });

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return NextResponse.json(
      { 
        message: "Password reset failed. Please try again later.",
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}