"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  BellIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  address: string;
  id_number: string;
  photo_url?: string | null;
  birthdate: string;
  issued_at: string;
  issued_by: string;
  is_head?: boolean;
  household_id?: string;
  fourps?: boolean;
  pwd?: boolean;
  senior?: boolean;
  slp?: boolean;
}

export default function DigitalID() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("digital-id");

  // Mock Data
  const resident: Resident = {
    resident_id: 567,
    first_name: "Josh Gerald",
    last_name: "Merzo",
    address: "Pasay City, Metro Manila",
    id_number: "PHL-2025-01-000567",
    photo_url: "https://www.facebook.com/6e2942e3-6b9c-401a-aaeb-8d6ad2ab5941",
    birthdate: "2003-07-12",
    issued_at: "2025-10-20",
    issued_by: "9001",
    is_head: true,
    household_id: "HH-2025-009",
    fourps: false,
    pwd: false,
    senior: false,
    slp: true,
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const cardRef = useRef<HTMLDivElement>(null);

  const qrData = `
First Name: ${resident.first_name}
Last Name: ${resident.last_name}
ID Number: ${resident.id_number}
Address: ${resident.address}
${resident.is_head ? "Head of Household" : ""}
Household ID: ${resident.household_id}
${resident.fourps ? "4Ps Beneficiary" : ""}
${resident.pwd ? "PWD Member" : ""}
${resident.senior ? "Senior Citizen" : ""}
${resident.slp ? "SLP Beneficiary" : ""}
`.trim();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current);
    const link = document.createElement("a");
    link.download = `${resident.first_name}-${resident.last_name}-DigitalID.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current);
    const dataUrl = canvas.toDataURL();
    const printWindow = window.open("");
    if (printWindow) {
      printWindow.document.write(`<img src="${dataUrl}" style="width:100%">`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const features = [
    { name: "home", label: "Home", icon: HomeIcon },
    { name: "manage-profile", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback / Complain", icon: ChatBubbleLeftEllipsisIcon },
    { name: "notifications", label: "Notifications", icon: BellIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "block" : "hidden"
        } md:block md:relative md:translate-x-0 ${
          sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : ""
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link
                  href={`/dash-front/${name}`}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name ? "text-red-700" : "text-black hover:text-red-700"
                  }`}
                  onClick={() => setActiveItem(name)}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full ${
                      activeItem === name ? "block" : "hidden"
                    }`}
                  />
                  <Icon className="w-6 h-6 mr-2 group-hover:text-red-700" />
                  {sidebarOpen && <span className="group-hover:text-red-700">{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4">
          <button className="flex items-center gap-3 text-red-500 hover:text-red-700 transition w-full text-left">
            Log Out
          </button>
        </div>

        <div className="p-4 flex justify-center hidden md:flex">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center shadow-sm"
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5 text-black" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Barangay Digital ID</h1>
          <div className="flex items-center space-x-4">
            <button className="text-black hover:text-red-700 focus:outline-none">
              <BellIcon className="w-6 h-6" />
            </button>
            <img
              src={resident.photo_url || "/default-profile.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover shadow-sm"
            />
          </div>
        </header>

        {/* ID Card Section */}
        <main className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-8 shadow-md">
          <div
            ref={cardRef}
            className="relative w-[550px] h-[300px] bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-full w-[15px] bg-gradient-to-b from-red-700 via-white to-blue-700" />
            <div className="flex h-full p-6 pl-10">
              <div className="flex flex-col justify-between">
                <img
                  src={resident.photo_url || "/default-profile.png"}
                  alt="Profile"
                  className="w-28 h-28 rounded-md border border-gray-300 object-cover"
                />
                <div className="text-sm mt-2">
                  <p>Issued: {resident.issued_at}</p>
                  <p>Issued by: {resident.issued_by}</p>
                </div>
              </div>
              <div className="flex-1 pl-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500">REPUBLIC OF THE PHILIPPINES</p>
                  <h2 className="text-lg font-bold leading-tight">BARANGAY DIGITAL ID</h2>
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
                  <div className="w-24 h-24">
                    <QRCode value={`Name: ${resident.first_name} ${resident.last_name}\nID: ${resident.id_number}\nAddress: ${resident.address}`} size={90} />
                  </div>
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
              Download
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
