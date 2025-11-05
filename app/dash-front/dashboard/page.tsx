"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { BellIcon, Bars3Icon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ArrowRightOnRectangleIcon, HomeIcon, UserIcon, CreditCardIcon, ClipboardDocumentIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import NotificationDropdown from "../../components/NotificationDropdown";

interface Stats {
  totalResidents: number;
  totalStaff: number;
  totalCertificates: number;
  totalFeedback: number;
  totalAnnouncements: number;
}

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function ReportsDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("reports");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Sidebar navigation
  const features = [
    { name: "the-dash-resident", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback / Complain", icon: ChatBubbleLeftEllipsisIcon },
    { name: "reports", label: "Reports", icon: ClipboardDocumentIcon },
  ];

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/dash/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  // Export PDF
  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF();
    doc.text("Barangay Reports Summary", 14, 20);
    const tableData = [
      ["Residents", stats.totalResidents],
      ["Staff", stats.totalStaff],
      ["Certificates", stats.totalCertificates],
      ["Feedback", stats.totalFeedback],
      ["Announcements", stats.totalAnnouncements],
    ];
    (doc as any).autoTable({
      head: [["Category", "Total Count"]],
      body: tableData,
      startY: 30,
    });
    doc.save("ReportsSummary.pdf");
  };

  // Export CSV
  const exportCSV = () => {
    if (!stats) return;
    const csvRows = [
      ["Category", "Total Count"],
      ["Residents", stats.totalResidents],
      ["Staff", stats.totalStaff],
      ["Certificates", stats.totalCertificates],
      ["Feedback", stats.totalFeedback],
      ["Announcements", stats.totalAnnouncements],
    ];
    const csvContent = csvRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ReportsSummary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to bg-slate-50 p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col 
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}
      >
        <div className="p-4 flex items-center justify-between">
          <img src="/niugan-logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <button onClick={toggleSidebar} className="block md:hidden text-black hover:text-red-700 focus:outline-none">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link
                  href={`/dash-front/${name}`}
                  onClick={() => setActiveItem(name)}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name
                      ? "text-red-700 font-semibold"
                      : "text-black hover:text-red-700"
                  }`}
                >
                  {activeItem === name && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-6 h-6 mr-2 ${
                      activeItem === name
                        ? "text-red-700"
                        : "text-gray-600 group-hover:text-red-700"
                    }`}
                  />
                  {sidebarOpen && (
                    <span
                      className={`${
                        activeItem === name
                          ? "text-red-700"
                          : "group-hover:text-red-700"
                      }`}
                    >
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>

        <div className="p-4 flex justify-center hidden md:flex">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center focus:outline-none transition-colors duration-200 shadow-sm"
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5 text-black" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-white/80 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Reports Dashboard</h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
          </div>
        </header>

        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Summary Reports</h2>

          {!stats ? (
            <p className="text-gray-600">No data available.</p>
          ) : (
            <>
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-red-700 text-white">
                    <th className="py-3 px-4 text-left">Category</th>
                    <th className="py-3 px-4 text-left">Total Count</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Residents", stats.totalResidents],
                    ["Staff", stats.totalStaff],
                    ["Certificates", stats.totalCertificates],
                    ["Feedback", stats.totalFeedback],
                    ["Announcements", stats.totalAnnouncements],
                  ].map(([category, count]) => (
                    <tr key={category} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{category}</td>
                      <td className="py-3 px-4">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={exportPDF}
                  className="bg-red-700 text-white px-4 py-2 rounded-lg shadow hover:bg-red-800 transition"
                >
                  Download PDF
                </button>
                <button
                  onClick={exportCSV}
                  className="bg-gray-200 text-black px-4 py-2 rounded-lg shadow hover:bg-gray-300 transition"
                >
                  Download CSV
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
