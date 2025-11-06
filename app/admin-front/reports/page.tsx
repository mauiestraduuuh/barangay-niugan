"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
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
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Make all stats numbers to satisfy TypeScript
  const [stats, setStats] = useState<Record<string, number>>({
    totalResidents: 0,
    totalStaff: 0,
    totalCertificates: 0,
    totalFeedback: 0,
    totalAnnouncements: 0,
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff-acc", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  useEffect(() => {
    // Fetch notifications
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
    fetchNotifications();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
        params: { from: dateRange.from, to: dateRange.to },
      });
      setStats(res.data.stats);
    } catch (error) {
      console.error(error);
      setMessage("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (category: string) => {
  setActiveCategory(category);
  setDetails([]); // reset

  try {
    const res = await axios.get(`/api/admin/reports?category=${category}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const flattenedDetails = res.data.details.map((item: any) => {
      const newItem: any = { ...item };

      // Flatten resident and keep resident_id
      if (item.resident) {
        newItem.resident_id = item.resident.resident_id;
        newItem.resident_first_name = item.resident.first_name;
        newItem.resident_last_name = item.resident.last_name;
        delete newItem.resident; // remove nested object
      }

      // Flatten headResident
      if (item.headResident) {
        newItem.head_resident_id = item.headResident.resident_id;
        newItem.head_resident_first_name = item.headResident.first_name;
        newItem.head_resident_last_name = item.headResident.last_name;
        delete newItem.headResident;
      }

      // Flatten headStaff
      if (item.headStaff) {
        newItem.head_staff_id = item.headStaff.staff_id;
        newItem.head_staff_first_name = item.headStaff.first_name;
        newItem.head_staff_last_name = item.headStaff.last_name;
        delete newItem.headStaff;
      }

      return newItem;
    });

    setDetails(flattenedDetails);
  } catch (err) {
    console.error(err);
  }
};

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Barangay Report Summary", 14, 16);
    autoTable(doc, {
      startY: 25,
      head: [["Category", "Count"]],
      body: Object.entries(stats)
        .filter(([_, value]) => typeof value === "number")
        .map(([key, value]) => [key.replace(/^total/i, ""), value]),
    });
    doc.save("barangay_report.pdf");
  };

  const handleExportCSV = () => {
    const csv = Object.entries(stats)
      .filter(([_, value]) => typeof value === "number")
      .map(([key, value]) => [key.replace(/^total/i, ""), value])
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

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4 ">
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
        {/* Logo + Close */}
        <div className="p-4 flex items-center justify-center">
          <img
            src="/niugan-logo.png"
            alt="Company Logo"
            className={`rounded-full object-cover transition-all duration-300 ${
              sidebarOpen ? "w-30 h-30" : "w-8.5 h-8.5"
            }`}
          />

          <button
            onClick={toggleSidebar}
            className="absolute top-3 right-3 text-black hover:text-red-700 focus:outline-none md:hidden"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
{/* Navigation */}
 <nav className="flex-1 mt-6">
    <ul>
      {features.map(({ name, label, icon: Icon }) => {
        const href = `/admin-front/${name}`;
        const isActive = name === "admin-profile";
        return (
          <li key={name} className="mb-2">
            <Link href={href}>
              <span
                className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                  isActive
                    ? "text-red-700 "
                    : "text-black hover:text-red-700"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />
                )}
                <Icon
                  className={`w-6 h-6 mr-2 ${
                    isActive ? "text-red-700" : "text-gray-600 group-hover:text-red-700"
                  }`}
                />
                {sidebarOpen && (
                  <span
                    className={`${
                      isActive ? "text-red-700" : "group-hover:text-red-700"
                    }`}
                  >
                    {label}
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>

        {/* Sidebar Toggle (desktop only) */}
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

      {/* Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>
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

        <main className="flex-1 bg-white/80 backdrop-blur-md shadow-md rounded-xl p-4 sm:p-6">
          {/* Date Form */}
          <form className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-600">Start Date</label>
              <input
                type="date"
                className="mt-1 block w-full sm:w-48 rounded-md border border-gray-300 p-2 text-sm focus:border-red-600 focus:ring-red-600"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">End Date</label>
              <input
                type="date"
                className="mt-1 block w-full sm:w-48 rounded-md border border-gray-300 p-2 text-sm focus:border-red-600 focus:ring-red-600"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={fetchStats}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg shadow-sm transition-all w-full sm:w-auto"
            >
              Generate
            </button>
          </form>

          {/* Cards / Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(stats)
              .filter(([_, value]) => typeof value === "number")
              .map(([key, value]) => (
                <div
                  key={key}
                  onClick={() => fetchDetails(key.replace(/^total/i, "").toLowerCase())}
                  className="cursor-pointer bg-white shadow-md p-6 rounded-lg hover:bg-red-50 transition flex flex-col items-start"
                >
                  <h3 className="text-lg font-semibold text-gray-800">
                    {key.replace(/^total/i, "")}
                  </h3>
                  <p className="text-3xl font-bold text-red-700 mt-2">{value}</p>
                  <p className="text-sm text-gray-600 mt-1">Click to view details</p>
                </div>
              ))}
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

      {/* Modal for Details */}
      {activeCategory && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-11/12 md:w-2/3 lg:w-1/2 p-6 relative">
            <button
              onClick={() => setActiveCategory(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-black mb-4 capitalize">
              {activeCategory} Details
            </h2>

            {details.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No records found.</p>
            ) : (
              <div className="overflow-x-auto max-h-80">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-red-700 text-white">
                    <tr>
                      {Object.keys(details[0]).map((key) => (
                        <th key={key} className="px-4 py-2 text-left capitalize">
                          {key.replaceAll("_", " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((item, i) => (
                      <tr key={i} className="border-t hover:bg-red-50 transition">
                        {Object.entries(item).map(([key, val], j) => (
                          <td key={j} className="px-4 py-2 text-sm text-gray-700">
                            {["created_at","requested_at","approved_at","submitted_at","responded_at"].includes(key)
                              ? new Date(val as string).toLocaleDateString()
                              : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
