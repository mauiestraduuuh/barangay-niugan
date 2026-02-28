import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../lib/prisma";
import jwt from "jsonwebtoken";
import { supabase } from "@/../lib/supabase";
import { getCertificateHTML } from "@/../lib/generateCertificate";
import puppeteer from "puppeteer";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserFromToken(req: NextRequest): { userId: number; role: string } | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

async function verifyAdminUser(userId: number) {
  const admin = await prisma.user.findFirst({ where: { user_id: userId, role: "ADMIN" } });
  return !!admin;
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    const pdfBuffer = await page.pdf({
      width: "816px",
      height: "1056px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await verifyAdminUser(user.userId)))
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { request_id } = await req.json();
    if (!request_id)
      return NextResponse.json({ error: "request_id is required" }, { status: 400 });

    const certRequest = await prisma.certificateRequest.findUnique({
      where: { request_id: Number(request_id) },
      include: {
        resident: true,
        approvedBy: { select: { username: true } },
      },
    });

    if (!certRequest)
      return NextResponse.json({ error: "Certificate request not found" }, { status: 404 });

    if (certRequest.status !== "APPROVED")
      return NextResponse.json(
        { error: "Request must be approved before generating a certificate" },
        { status: 400 }
      );

    const approvedByName = certRequest.approvedBy?.username || "Authorized Admin";
    const barangayName = process.env.BARANGAY_NAME || "BARANGAY NIUGAN";
    const barangayAddress = process.env.BARANGAY_ADDRESS || "Barangay Hall, Niugan, Biñan City, Laguna";
    const captainName = process.env.CAPTAIN_NAME || "HON. BARANGAY CAPTAIN";

    const htmlContent = getCertificateHTML(
      certRequest.certificate_type,
      {
        first_name: certRequest.resident.first_name,
        last_name: certRequest.resident.last_name,
        birthdate: certRequest.resident.birthdate,
        gender: certRequest.resident.gender,
        address: certRequest.resident.address,
        contact_no: certRequest.resident.contact_no,
        is_pwd: certRequest.resident.is_pwd,
        is_4ps_member: certRequest.resident.is_4ps_member,
        is_indigenous: certRequest.resident.is_indigenous,
        household_number: certRequest.resident.household_number,
      },
      {
        request_id: certRequest.request_id,
        purpose: certRequest.purpose ?? null,
        approved_at: certRequest.approved_at ?? null,
        claim_code: certRequest.claim_code ?? null,
      },
      approvedByName,
      barangayName,
      barangayAddress,
      captainName
    );

    const pdfBuffer = await htmlToPdf(htmlContent);
    const fileName = "certificate-" + certRequest.request_id + "-" + Date.now() + ".pdf";

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload("certificates/" + fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload certificate" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl("certificates/" + fileName);

    await prisma.certificateRequest.update({
      where: { request_id: Number(request_id) },
      data: { file_path: urlData.publicUrl },
    });

    return NextResponse.json({
      message: "Certificate generated successfully",
      certificate_url: urlData.publicUrl,
    });
  } catch (error) {
    console.error("Generate certificate error:", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}