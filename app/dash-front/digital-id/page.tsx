"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  address?: string;
  id_number: string;
  photo_url?: string | null;
  birthdate?: string;
  issued_at?: string | null;
  issued_by?: string | null;
  qr_code?: string | null;
}

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function DigitalID() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [resident, setResident] = useState<Resident | null>(null);
  const [loadingResident, setLoadingResident] = useState(true);
  const [errorResident, setErrorResident] = useState<string | null>(null);
  const [household, setHousehold] = useState<any[]>([]);
  const [householdRegNo, setHouseholdRegNo] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchDigitalID = async () => {
      setLoadingResident(true);
      try {
        const token = getToken();
        if (!token) {
          window.location.href = "/login";
          return;
        }
        const res = await axios.get("/api/dash/digital-id", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { resident, digitalID } = res.data;
        setResident({
          resident_id: resident.resident_id,
          first_name: resident.first_name,
          last_name: resident.last_name,
          address: resident.address,
          photo_url: resident.photo_url,
          birthdate: resident.birthdate,
          id_number: digitalID.id_number,
          issued_at: digitalID.issued_at,
          issued_by: digitalID.issued_by?.toString() || "N/A",
          qr_code: digitalID.qr_code || null,
          hpusehold_id: resident.household_id ?? null
        });
      } catch (err) {
        console.error(err);
        setErrorResident("Failed to fetch digital ID");
      } finally {
        setLoadingResident(false);
      }
    };
    fetchDigitalID();
  }, []);

  // Generate PDF with resident details and household
  const handleDownload = () => {
    if (!resident) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Simple header
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("RESIDENT INFORMATION", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
    doc.setFontSize(16);
    doc.text("SUMMARY", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // divider line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, yPosition, pageWidth - 15, yPosition);

    yPosition += 15;

    // Personal Information 
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(15, yPosition, pageWidth - 30, 75, 3, 3, "F");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, yPosition, pageWidth - 30, 75, 3, 3, "S");

    // resident photo
    if (resident.photo_url) {
      try {
        doc.addImage(resident.photo_url, "JPEG", 20, yPosition + 5, 35, 35);
        // Photo border
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPosition + 5, 35, 35, 2, 2, "S");
      } catch (e) {
        console.error("Could not add photo:", e);
      }
    }

    // QR Code
    if (resident.qr_code) {
      try {
        doc.addImage(resident.qr_code, "PNG", 20, yPosition + 45, 25, 25);
      } catch (e) {
        console.error("Could not add QR code:", e);
      }
    }

    // Personal details
    const detailsX = 65;
    let detailY = yPosition + 10;

    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Personal Information", detailsX, detailY);
    detailY += 10;

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    const details = [
      { label: "Name:", value: `${resident.first_name} ${resident.last_name}` },
      { label: "ID Number:", value: resident.id_number },
      { label: "Address:", value: resident.address || "N/A" },
      { label: "Birthdate:", value: resident.birthdate || "N/A" },
      { label: "Issued:", value: resident.issued_at || "N/A" },
      { label: "Issued By:", value: resident.issued_by || "N/A" },
    ];

    details.forEach((detail) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(detail.label, detailsX, detailY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(detail.value, detailsX + 25, detailY);
      detailY += 7;
    });

    yPosition += 85;

    // Household Information 
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Household Information", 15, yPosition);
    yPosition += 8;

    // Registered Household Number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Household ID:", 15, yPosition);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.text(
      resident.household_id ? resident.household_id.toString() : "",
      50,
      yPosition
    );    
    yPosition += 10;

    if (household && household.length > 0) {
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(15, yPosition - 2, pageWidth - 30, 10, 2, 2, "F");
      
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Name", 20, yPosition + 5);
      doc.text("Role", 80, yPosition + 5);
      doc.text("Relationship", 110, yPosition + 5);
      doc.text("Birthdate", 155, yPosition + 5);
      yPosition += 12;

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      household.forEach((member, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 252);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(15, yPosition - 5, pageWidth - 30, 10, "F");

        // Row border
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.1);
        doc.line(15, yPosition + 5, pageWidth - 15, yPosition + 5);

        doc.setTextColor(60, 60, 60);
        doc.text(
          `${member.first_name || ""} ${member.last_name || ""}`,
          20,
          yPosition + 2
        );
        doc.text(member.role || "N/A", 80, yPosition + 2);
        doc.text(member.relationship || "N/A", 110, yPosition + 2);
        doc.text(member.birthdate || "N/A", 155, yPosition + 2);
        yPosition += 10;
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("No household members found.", 20, yPosition + 5);
    }

    // Footer
    const footerY = pageHeight - 20;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(15, footerY, pageWidth - 15, footerY);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      footerY + 5,
      { align: "center" }
    );

    doc.setFontSize(8);
    doc.text("Republic of the Philippines - Barangay Niugan Digital ID System", pageWidth / 2, footerY + 10, {
      align: "center",
    });

    doc.save(`${resident.first_name}_${resident.last_name}_Record.pdf`);
  };

  // Print only the ID card
  const handlePrint = () => {
    if (!cardRef.current) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Digital ID</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f0f0f0;
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .id-card {
                position: relative;
                width: 550px;
                height: 300px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                border: 1px solid #d1d5db;
                overflow: hidden;
                display: flex;
              }
              .gradient-bar {
                width: 20px;
                height: 100%;
                background: linear-gradient(to bottom, #d90429 0%, #ffffff 50%, #003f88 100%);
                flex-shrink: 0;
              }
              .card-content {
                display: flex;
                padding: 24px;
                width: 100%;
                gap: 24px;
              }
              .left-section {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-width: 112px;
              }
              .profile-photo {
                width: 112px;
                height: 112px;
                border-radius: 6px;
                border: 1px solid #d1d5db;
                object-fit: cover;
                display: block;
              }
              .issued-info {
                font-size: 14px;
                margin-top: 8px;
                line-height: 1.4;
              }
              .issued-info p {
                margin: 2px 0;
              }
              .right-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .top-content {
                flex: 1;
              }
              .header-text {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 2px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                line-height: 1.3;
                margin-bottom: 4px;
              }
              .id-number-row {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-top: 4px;
                margin-bottom: 16px;
              }
              .id-number-row p:first-child {
                font-weight: 600;
              }
              .resident-name {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 4px;
              }
              .address {
                font-size: 14px;
                color: #374151;
              }
              .qr-section {
                display: flex;
                justify-content: flex-end;
                align-items: flex-end;
              }
              .qr-code {
                width: 90px;
                height: 90px;
                object-fit: contain;
                display: block;
              }
              .qr-placeholder {
                font-size: 12px;
                color: #6b7280;
              }
              @media print {
                @page {
                  margin: 0.5in;
                }
                body {
                  background: white;
                }
                .id-card {
                  box-shadow: none;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="id-card">
              <div class="gradient-bar"></div>
              <div class="card-content">
                <div class="left-section">
                  <img 
                    src="${resident.photo_url || "/default-profile.png"}" 
                    alt="Profile" 
                    class="profile-photo"
                    crossorigin="anonymous"
                  />
                  <div class="issued-info">
                    <p>Issued: ${resident.issued_at || "N/A"}</p>
                    <p>Issued by: ${resident.issued_by || "N/A"}</p>
                  </div>
                </div>
                <div class="right-section">
                  <div class="top-content">
                    <p class="header-text">REPUBLIC OF THE PHILIPPINES</p>
                    <h2 class="title">BARANGAY DIGITAL ID</h2>
                    <div class="id-number-row">
                      <p>ID No.</p>
                      <p>${resident.id_number}</p>
                    </div>
                    <p class="resident-name">${resident.first_name} ${resident.last_name}</p>
                    <p class="address">${resident.address || "N/A"}</p>
                  </div>
                  <div class="qr-section">
                    ${
                      resident.qr_code
                        ? `<img src="${resident.qr_code}" alt="QR Code" class="qr-code" crossorigin="anonymous" />`
                        : '<p class="qr-placeholder">QR not available</p>'
                    }
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  if (loadingResident)
    return <p className="text-center mt-20">Loading digital ID...</p>;
  if (errorResident)
    return <p className="text-center mt-20 text-red-500">{errorResident}</p>;
  if (!resident)
    return <p className="text-center mt-20 text-red-500">No data found</p>;

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          <h2
            className={`text-xl font-bold text-black ${
              !sidebarOpen && "hidden"
            }`}
          >
            Menu
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-black hover:text-red-700"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        <nav className="flex-1 mt-6">
          <ul>
            <li className="mb-2">
              <Link href="/dash-front">
                <span className="flex items-center px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <HomeIcon className="w-6 h-6 mr-2" />
                  {sidebarOpen && "Dashboard"}
                </span>
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dash-front/profile">
                <span className="flex items-center px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <UserIcon className="w-6 h-6 mr-2" />
                  {sidebarOpen && "Profile"}
                </span>
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dash-front/digital-id">
                <span className="flex items-center px-4 py-2 text-red-700 bg-red-50 rounded-lg">
                  <CreditCardIcon className="w-6 h-6 mr-2" />
                  {sidebarOpen && "Digital ID"}
                </span>
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dash-front/documents">
                <span className="flex items-center px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <ClipboardDocumentIcon className="w-6 h-6 mr-2" />
                  {sidebarOpen && "Documents"}
                </span>
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dash-front/feedback">
                <span className="flex items-center px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <ChatBubbleLeftEllipsisIcon className="w-6 h-6 mr-2" />
                  {sidebarOpen && "Feedback"}
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4">
          <button className="flex items-center gap-3 text-black hover:text-red-700 w-full">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && "Log Out"}
          </button>
        </div>
      </div>

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <h1 className="text-xl font-semibold text-black">
            Barangay Digital ID
          </h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        <main className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-8 shadow-md">
          <div
            ref={cardRef}
            className="relative w-[550px] h-[300px] bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden flex"
          >
            {/* Left gradient bar */}
            <div
              className="w-[20px] h-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgb(217, 4, 41) 0%, rgb(255, 255, 255) 50%, rgb(0, 63, 136) 100%)",
              }}
            ></div>

            {/* Card Content */}
            <div className="flex h-full p-6 w-full">
              <div className="flex flex-col justify-between">
                <img
                  src={resident.photo_url || "/default-profile.png"}
                  alt="Profile"
                  className="w-28 h-28 rounded-md border border-gray-300 object-cover"
                />
                <div className="text-sm mt-2">
                  <p>Issued: {resident.issued_at || "N/A"}</p>
                  <p>Issued by: {resident.issued_by || "N/A"}</p>
                </div>
              </div>
              <div className="flex-1 pl-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500">
                    REPUBLIC OF THE PHILIPPINES
                  </p>
                  <h2 className="text-lg font-bold leading-tight">
                    BARANGAY DIGITAL ID
                  </h2>
                  <div className="flex justify-between">
                    <p className="text-xs font-semibold mt-1">ID No.</p>
                    <p className="text-xs mt-1">{resident.id_number}</p>
                  </div>
                  <p className="text-base font-semibold mt-4">
                    {resident.first_name} {resident.last_name}
                  </p>
                  <p className="text-sm text-gray-700">{resident.address}</p>
                </div>
                <div className="flex justify-end">
                  {resident.qr_code ? (
                    <img
                      src={resident.qr_code}
                      alt="QR Code"
                      className="w-[90px] h-[90px] object-contain"
                    />
                  ) : (
                    <p className="text-xs text-gray-500">QR not available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-900 transition"
            >
              <PrinterIcon className="w-5 h-5" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download Record
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}