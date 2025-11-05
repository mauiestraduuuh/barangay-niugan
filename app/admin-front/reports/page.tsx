"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function ReportsSection() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("reports");
  const [view, setView] = useState<"table" | "chart">("table");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResidents: 0,
    totalStaff: 0,
    totalCertificates: 0,
    totalFeedback: 0,
    totalAnnouncements: 0,
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff-acc", label: "Staff Accounts", icon: UsersIcon },
    { name: "manage-announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dash/reports");
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (view === "chart" && typeof window !== "undefined" && !loading) {
      import("chart.js/auto").then(({ default: Chart }) => {
        const ctx = document.getElementById("reportChart") as HTMLCanvasElement;
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Residents", "Staff", "Certificates", "Feedback", "Announcements"],
            datasets: [
              {
                label: "Total Count",
                data: [
                  stats.totalResidents,
                  stats.totalStaff,
                  stats.totalCertificates,
                  stats.totalFeedback,
                  stats.totalAnnouncements,
                ],
                backgroundColor: "#b91c1c",
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
            },
            scales: { y: { beginAtZero: true } },
          },
        });
      });
    }
  }, [view, stats, loading]);

  const handleExportCSV = () => {
    const csv = [
      ["Category", "Count"],
      ["Residents", stats.totalResidents],
      ["Staff", stats.totalStaff],
      ["Certificates", stats.totalCertificates],
      ["Feedback", stats.totalFeedback],
      ["Announcements", stats.totalAnnouncements],
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barangay_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Barangay Report Summary", 14, 16);
    doc.setFontSize(11);

    const rows = [
      ["Residents", stats.totalResidents.toString()],
      ["Staff", stats.totalStaff.toString()],
      ["Certificates", stats.totalCertificates.toString()],
      ["Feedback", stats.totalFeedback.toString()],
      ["Announcements", stats.totalAnnouncements.toString()],
    ];

    let y = 30;
    rows.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, y);
      y += 10;
    });

    doc.save("barangay_report.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-slate-50 p-2 sm:p-4 flex flex-col md:flex-row gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 flex flex-col 
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}
      >
        <div className="p-4 flex items-center justify-between">
          <img src="/niugan-logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
          <button onClick={toggleSidebar} className="block md:hidden text-black hover:text-red-700">
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
                  className={`relative flex items-center px-4 py-2 transition-all duration-200 ${
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
                  {sidebarOpen && <span>{label}</span>}
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-white/80 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-3 sm:p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-black">Admin Reports</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-white/80 backdrop-blur-md shadow-md rounded-xl p-4 sm:p-6">
          {/* Date Form */}
          <form className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-600">Start Date</label>
              <input
                type="date"
                className="mt-1 block w-full sm:w-48 rounded-md border border-gray-300 p-2 text-sm focus:border-red-600 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">End Date</label>
              <input
                type="date"
                className="mt-1 block w-full sm:w-48 rounded-md border border-gray-300 p-2 text-sm focus:border-red-600 focus:ring-red-600"
              />
            </div>
            <button
              type="submit"
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg shadow-sm transition-all w-full sm:w-auto"
            >
              Generate
            </button>
          </form>

          {/* Toggle View */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h3 className="text-md font-semibold text-gray-800">Report Summary</h3>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                className={`px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition w-1/2 sm:w-auto ${
                  view === "table" ? "bg-gray-100" : ""
                }`}
                onClick={() => setView("table")}
              >
                Table View
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition w-1/2 sm:w-auto ${
                  view === "chart" ? "bg-gray-100" : ""
                }`}
                onClick={() => setView("chart")}
              >
                Chart View
              </button>
            </div>
          </div>

          {/* Data Display */}
          <div className="bg-white rounded-xl shadow-inner p-4 border border-gray-100 min-h-[300px] overflow-x-auto">
            {loading ? (
              <p className="text-center text-gray-500">Loading data...</p>
            ) : view === "table" ? (
              <table className="min-w-full text-sm text-left border border-gray-200">
                <thead className="bg-red-700 text-white">
                  <tr>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">Residents</td>
                    <td className="px-4 py-2">{stats.totalResidents}</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">Staff</td>
                    <td className="px-4 py-2">{stats.totalStaff}</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">Certificates</td>
                    <td className="px-4 py-2">{stats.totalCertificates}</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">Feedback</td>
                    <td className="px-4 py-2">{stats.totalFeedback}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Announcements</td>
                    <td className="px-4 py-2">{stats.totalAnnouncements}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <canvas id="reportChart" className="w-full h-full"></canvas>
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row justify-end mt-6 gap-3">
            <button
              onClick={handleExportPDF}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto"
            >
              <DocumentTextIcon className="w-5 h-5" />
              Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto"
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
