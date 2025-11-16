"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  BellIcon,
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
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [errorResident, setErrorResident] = useState<string | null>(null);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchDigitalID = async () => {
      setLoadingResident(true);
      setErrorResident(null);
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
        if (!resident || !digitalID) {
          setErrorResident("Invalid digital ID data received.");
          return;
        }

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
        });
      } catch (err: any) {
        const status = err?.response?.status;
        const apiMsg = err?.response?.data?.error || err?.response?.data?.message;

        if (status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        if (status === 404) {
          setErrorResident(
            "Digital ID not found. Please ensure your profile has been approved by the barangay administrator."
          );
          return;
        }
        setErrorResident(apiMsg || "Failed to fetch digital ID");
      } finally {
        setLoadingResident(false);
      }
    };

    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      setErrorNotifications(null);
      try {
        const token = getToken();
        if (!token) return;
        const res = await axios.get<Notification[]>("/api/dash/notification", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
        setErrorNotifications(apiMsg || "Failed to fetch notifications");
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchDigitalID();
    fetchNotifications();
  }, []);

 // 🧼 helper to sanitize any oklch() colors before rendering
const sanitizeOklchColors = (el: HTMLElement) => {
  const elements = el.querySelectorAll("*");
  elements.forEach((child) => {
    const style = window.getComputedStyle(child);
    const bg = style.backgroundColor;
    const color = style.color;
    if (bg.includes("oklch")) (child as HTMLElement).style.backgroundColor = "#fff";
    if (color.includes("oklch")) (child as HTMLElement).style.color = "#000";
  });
};

// 🖼️ download the card as PNG
const handleDownload = async () => {
  if (!cardRef.current || !resident) return;

  sanitizeOklchColors(cardRef.current); // 🧩 apply fix before capture

  const canvas = await html2canvas(cardRef.current, {
    useCORS: true,
    allowTaint: true,
    scale: 3,
    backgroundColor: "#ffffff",
  });

  const link = document.createElement("a");
  link.download = `${resident.first_name}-${resident.last_name}-DigitalID.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

// 🖨️ print the card
const handlePrint = async () => {
  if (!cardRef.current || !resident) return;

  sanitizeOklchColors(cardRef.current); // 🧩 apply fix before capture

  const canvas = await html2canvas(cardRef.current, {
    useCORS: true,
    allowTaint: true,
    scale: 3,
    backgroundColor: "#ffffff",
  });

  const dataUrl = canvas.toDataURL("image/png");
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head><title>${resident.first_name} ${resident.last_name} - Digital ID</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f9f9f9;">
          <img src="${dataUrl}" style="width:550px;border-radius:12px;box-shadow:0 0 10px rgba(0,0,0,0.2);" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
};

  const features = [
    { name: "home", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback / Complain", icon: ChatBubbleLeftEllipsisIcon },
    { name: "notifications", label: "Notifications", icon: BellIcon },
  ];

  if (loadingResident) return <p className="text-center mt-20">Loading digital ID...</p>;
  if (errorResident) {
    return (
      <div className="text-center mt-20 text-red-500">
        <p>{errorResident}</p>
        <p className="mt-4">
          Please go to{" "}
          <Link href="/dash-front/resident" className="text-blue-600 underline">
            Manage Profile
          </Link>{" "}
          to verify your information.
        </p>
      </div>
    );
  }

  if (!resident)
    return <p className="text-center mt-20 text-red-500">Digital ID not found</p>;

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => {
              const href = `/dash-front/${name}`;
              const isActive = name === "digital-id";
              return (
                <li key={name} className="mb-2">
                  <Link href={href}>
                    <span
                      className={`flex items-center px-4 py-2 ${
                        isActive ? "text-red-700" : "text-black"
                      }`}
                    >
                      <Icon className="w-6 h-6 mr-2" />
                      {sidebarOpen && label}
                    </span>
                  </Link>
                </li>
              );
            })}
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Barangay Digital ID</h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        {/* ID Card */}
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
                  crossOrigin="anonymous"
                  className="w-28 h-28 rounded-md border border-gray-300 object-cover"
                />
                <div className="text-sm mt-2">
                  <p>Issued: {resident.issued_at || "N/A"}</p>
                  <p>Issued by: {resident.issued_by || "N/A"}</p>
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
                  {resident.qr_code ? (
                    <img
                      src={resident.qr_code}
                      alt="QR Code"
                      crossOrigin="anonymous"
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
              Download
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
