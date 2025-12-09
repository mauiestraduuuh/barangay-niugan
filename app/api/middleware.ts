import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export function middleware(req: NextRequest) {
  // Get token from cookies
  const token = req.cookies.get("token")?.value;

  // List of protected routes
  const protectedRoutes = [
    "/dash",
    "/dash-front",
    "/staff",
    "/staff-front",
    "/admin",
    "/admin-front",
  ];

  // Check if current path is protected
  const isProtected = protectedRoutes.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtected) {
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Invalid token → redirect to login
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow public routes
  return NextResponse.next();
}

// Apply middleware to all protected routes
export const config = {
  matcher: [
    "/dash/:path*",
    "/dash-front/:path*",
    "/staff/:path*",
    "/staff-front/:path*",
    "/admin/:path*",
    "/admin-front/:path*",
  ],
};
