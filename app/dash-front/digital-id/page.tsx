"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
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
  user_id?: number;
  first_name: string;
  last_name: string;
  address?: string;
  id_number: string;
  photo_url?: string | null;
  birthdate?: string;
  issued_at?: string | null;
  issued_by?: string | null;
  is_head?: boolean;
  household_id?: string | null;
  fourps?: boolean;
  pwd?: boolean;
  senior?: boolean;
  slp?: boolean;
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
    const fetchResident = async () => {
      setLoadingResident(true);
      setErrorResident(null);
      try {
        const token = getToken();
        if (!token) {
          window.location.href = "/login";
          return;
        }

        // Mirror Manage Profile: use the same endpoint and header
        const res = await axios.get<Resident>("/api/dash/resident", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data || !res.data.resident_id) {
          setErrorResident("Invalid resident data received");
          return;
        }
        setResident(res.data);
      } catch (err: any) {
        // If the backend returns JSON { error: "..." }, axios puts it in err.response.data
        const status = err?.response?.status;
        const apiMsg = err?.response?.data?.error || err?.response?.data?.message;

        if (status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        if (status === 404) {
          setErrorResident(
            "Resident data not found. Your profile may not be set up yet. Please contact the barangay administrator to register your information."
          );
          return;
        }
        setErrorResident(apiMsg || "Failed to fetch resident info");
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
        // Non-blocking: show error but don't break the page
        const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
        setErrorNotifications(apiMsg || "Failed to fetch notifications");
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchResident();
    fetchNotifications();
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current || !resident) return;
    const canvas = await html2canvas(cardRef.current);
    const link = document.createElement("a");
    link.download = `${resident.first_name}-${resident.last_name}-DigitalID.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handlePrint = async () => {
    if (!cardRef.current || !resident) return;
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
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback / Complain", icon: ChatBubbleLeftEllipsisIcon },
    { name: "notifications", label: "Notifications", icon: BellIcon },
  ];

  if (loadingResident) return <p className="text-center mt-20">Loading resident info...</p>;
  if (errorResident) {
    return (
      <div className="text-center mt-20 text-red-500">
        <p>{errorResident}</p>
        <p className="mt-4">
          Please go to{" "}
          <Link href="/dash-front/resident" className="text-blue-600 underline">
            Manage Profile
          </Link>{" "}
          to set up or verify your information.
        </p>
      </div>
    );
  }
  if (!resident) return <p className="text-center mt-20 text-red-500">Resident info not found</p>;

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
                    <span className={`flex items-center px-4 py-2 ${isActive ? "text-red-700" : "text-black"}`}>
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
            <NotificationDropdown
              notifications={notifications}
              loading={loadingNotifications}
              error={errorNotifications}
            />
            <img
              src={resident.photo_url || "/default-profile.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover shadow-sm"
            />
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
                  <QRCode
                    value={`Name: ${resident.first_name} ${resident.last_name}\nID: ${resident.id_number}\nAddress: ${resident.address}`}
                    size={90}
                  />
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