"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable"; // <-- important
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  KeyIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const [stats, setStats] = useState<Record<string, number>>({
    totalResidents: 0,
    totalStaff: 0,
    totalCertificates: 0,
    totalFeedback: 0,
    totalAnnouncements: 0,
    totalHouseholds: 0,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff-acc", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  // Fetch stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
        params: { from: dateRange.from, to: dateRange.to },
      });
      setStats(res.data.stats);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error(error);
      setMessage("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Quick date presets
  const applyPreset = (preset: string) => {
    const today = new Date();
    let from = "";
    let to = today.toISOString().split("T")[0];
    switch (preset) {
      case "today":
        from = to;
        break;
      case "this-week":
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        from = firstDay.toISOString().split("T")[0];
        break;
      case "this-month":
        from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
        break;
      case "last-month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        from = lastMonth.toISOString().split("T")[0];
        to = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
        break;
      case "year-to-date":
        from = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
        break;
    }
    setDateRange({ from, to });
    setTimeout(fetchStats, 100); // Fetch after state update
  };

  // Fetch details
  const fetchDetails = async (category: string) => {
    setActiveCategory(category);
    setDetails([]);
    setCurrentPage(1);
    setSearchTerm("");
    try {
      const res = await axios.get(`/api/admin/reports?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const flattened = res.data.details.map((item: any) => {
        const newItem = { ...item };
        if (item.resident) {
          newItem.resident_id = item.resident.resident_id;
          newItem.resident_first_name = item.resident.first_name;
          newItem.resident_last_name = item.resident.last_name;
          delete newItem.resident;
        }
        if (item.headResident) {
          newItem.head_resident_id = item.headResident.resident_id;
          newItem.head_resident_first_name = item.headResident.first_name;
          newItem.head_resident_last_name = item.headResident.last_name;
          delete newItem.headResident;
        }
        if (item.headStaff) {
          newItem.head_staff_id = item.headStaff.staff_id;
          newItem.head_staff_first_name = item.headStaff.first_name;
          newItem.head_staff_last_name = item.headStaff.last_name;
          delete newItem.headStaff;
        }
        if (item.members) {
          item.members.forEach((m: any, i: number) => {
            newItem[`member_${i + 1}_id`] = m.resident_id;
            newItem[`member_${i + 1}_first_name`] = m.first_name;
            newItem[`member_${i + 1}_last_name`] = m.last_name;
          });
          delete newItem.members;
        }
        if (item.staff_members) {
          item.staff_members.forEach((s: any, i: number) => {
            newItem[`staff_member_${i + 1}_id`] = s.staff_id;
            newItem[`staff_member_${i + 1}_first_name`] = s.first_name;
            newItem[`staff_member_${i + 1}_last_name`] = s.last_name;
          });
          delete newItem.staff_members;
        }
        if (item.category) {
          newItem.category_name = item.category.english_name;
          delete newItem.category;
        }
        if (item.respondedBy) {
          newItem.responded_by_username = item.respondedBy.username;
          delete newItem.respondedBy;
        }
        if (item.postedBy) {
          newItem.posted_by_username = item.postedBy.username;
          delete newItem.postedBy;
        }
        return newItem;
      });

      setDetails(flattened);
    } catch (err) {
      console.error(err);
    }
  };

  // Search + Sort + Pagination
  const filteredDetails = useMemo(() => {
    let filtered = details.filter((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig) {
      filtered = filtered.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [details, searchTerm, sortConfig, currentPage]);

  const totalPages = Math.ceil(details.filter((item) =>
    Object.values(item).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
  ).length / itemsPerPage);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Barangay Report Summary", 14, 16);
    (doc as any).autoTable({
      startY: 25,
      head: [["Category", "Count"]],
      body: Object.entries(stats)
        .filter(([_, value]) => typeof value === "number")
        .map(([key, value]) => [key.replace(/^total/i, ""), value]),
    });
    doc.save("barangay_report.pdf");
  };

  const handleExportDetailedPDF = () => {
    if (!activeCategory || details.length === 0) return;
    const doc = new jsPDF();
    doc.text(`${activeCategory} Details`, 14, 16);
    (doc as any).autoTable({
      startY: 25,
      head: [Object.keys(details[0]).map((k) => k.replaceAll("_", " "))],
      body: details.map((d) => Object.values(d).map((v) => String(v))),
    });
    doc.save(`${activeCategory}_details.pdf`);
  };

  // Export CSV
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

  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#8AFF33", "#FF8A33", "#B833FF"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
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
              const isActive = name === "reports";
              return (
                <li key={name} className="mb-2">
                  <Link href={href}>
                    <span
                      className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                        isActive ? "text-red-700" : "text-black hover:text-red-700"
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

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>

        {/* Sidebar Toggle */}
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

      {/* Overlay for mobile */}
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
        </header>

        <main className="flex-1 bg-white/80 backdrop-blur-md shadow-md rounded-xl p-4 sm:p-6">
          {/* Date Range Form */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end mb-6">
            <div>
              <label className="block text-sm font-medium text-black-600">Start Date</label>
              <input
                type="date"
                className="mt-1 block w-full sm:w-48 rounded-md border border-gray-300 p-2 text-black focus:border-red-600 focus:ring-red-600"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black-600">End Date</label>
              <input
                type="date"
                className="mt-1 block w-full sm:w-48 rounded-md border border-gray-300 p-2 text-black focus:border-red-600 focus:ring-red-600"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              {["today","this-week","this-month","last-month","year-to-date"].map((preset) => (
                <button key={preset} onClick={() => applyPreset(preset)} className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg text-black">{preset.replaceAll("-"," ")}</button>
              ))}
            </div>
            <button
              type="button"
              onClick={fetchStats}
              className="bg-red-700 hover:bg-red-800 text-black px-4 py-2 rounded-lg shadow-sm transition-all w-full sm:w-auto flex items-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5"/>
              Generate
            </button>
            {lastUpdated && <p className="text-sm text-gray-500 mt-2">Last updated: {lastUpdated}</p>}
          </div>

         {/* Charts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-black font-semibold mb-2">Category Distribution</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={Object.entries(stats)
                              .filter(([_, v]) => typeof v === "number")
                              .map(([k, v]) => ({ name: k.replace(/^total/i, ""), value: v }))}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={80}
                            fill="#8884d8"
                            labelLine={false} // remove connecting lines if desired
                          >
                            {Object.entries(stats).map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "white", color: "black" }}
                            itemStyle={{ color: "black" }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ color: "black", fontSize: "12px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-black font-semibold mb-2">Totals Overview</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={Object.entries(stats)
                            .filter(([_,v]) => typeof v === "number")
                            .map(([k,v]) => ({ name: k.replace(/^total/i,""), value: v }))}
                        >
                          <XAxis dataKey="name" stroke="black" />
                          <YAxis stroke="black" />
                          <Tooltip contentStyle={{ color: "black" }} />
                          <Bar dataKey="value" fill="#FF4B4B" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

          {/* Square Panels */}
          {loading ? (
            <div className="text-center py-6 text-gray-500">Loading stats...</div>
          ) : (
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
          )}

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

      {/* Details Modal */}
      {activeCategory && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-11/12 md:w-2/3 lg:w-1/2 p-6 relative max-h-[90vh] overflow-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-black mb-4 capitalize">
              {activeCategory} Details
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="mb-3 w-full p-2 border border-gray-300 rounded-md focus:ring-red-600 focus:border-red-600 text-sm"
            />

            {/* Table */}
            {details.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No records found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-red-700 text-white">
                      <tr>
                        {Object.keys(details[0]).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-2 text-left capitalize cursor-pointer"
                            onClick={() => requestSort(key)}
                          >
                            {key.replaceAll("_", " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDetails.map((item, i) => (
                        <tr key={i} className="border-t hover:bg-red-50 transition">
                          {Object.entries(item).map(([key, val], j) => (
                            <td key={j} className="px-4 py-2 text-sm text-gray-700">
                              {["created_at", "requested_at", "approved_at", "submitted_at", "responded_at", "posted_at"].includes(
                                key
                              )
                                ? new Date(val as string).toLocaleDateString()
                                : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between mt-3 items-center">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>

                {/* Export Detailed PDF */}
                <button
                  onClick={handleExportDetailedPDF}
                  className="mt-3 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  Export Detailed PDF
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
