"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  BellIcon,
  Bars3Icon,
  ChevronLeftIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Admin {
  id: number;
  name: string;
  photo_url?: string | null;
  role: string;
}

interface Overview {
  totalResidents: number;
  totalCertificates: number;
  totalFeedback: number;
  totalStaff: number;
  totalAnnouncements: number;
}

interface MonthlyRegistration {
  month: string;
  count: number;
}

interface Activity {
  request_id: number;
  certificate_type: string;
  resident: { first_name: string; last_name: string };
  requested_at: string;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter(); 
  const [activeItem, setActiveItem] = useState("the-dash-admin");
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRegistration[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth-front/login");
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage");
        return;
      }
      const res = await fetch("/api/admin/the-dash-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("API Error:", data);
        throw new Error(data.message || "Failed to fetch admin dashboard");
      }
      setAdmin(data.admin);
      setOverview(data.overview);
      setMonthlyData(data.monthlyRegistrations);
      setRecentActivity(data.recentActivity);
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
        {/* Sidebar */}
              <div
                className={`${
                  sidebarOpen ? "w-64" : "w-16"
                } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col 
                ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}
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
                    {features.map(({ name, label, icon: Icon }) => (
                      <li key={name} className="mb-2">
                        <Link
                          href={`/admin-front/${name}`}
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
        
              {/* Functional Logout Button */}
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
        
              {/* Mobile Overlay */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-white/80 z-40 md:hidden"
                  onClick={toggleSidebar}
                ></div>
              )}
      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold text-black">Admin Dashboard</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto text-black">
          {admin && (
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold">{`Welcome back, ${admin.name}!`}</h2>
            </div>
          )}

          {/* Overview Cards */}
          {overview && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Residents", value: overview.totalResidents },
                { label: "Certificates", value: overview.totalCertificates },
                { label: "Feedback", value: overview.totalFeedback },
                { label: "Staff", value: overview.totalStaff },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
                >
                  <h3 className="text-black">{item.label}</h3>
                  <p className="text-3xl font-bold text-red-700">{item.value}</p>
                </div>
              ))}
            </section>
          )}

          {/* Chart Section */}
          <section className="mb-4">
            <h2 className="text-xl font-semibold mb-4">Monthly Registrations</h2>
            <div className="bg-white p-6 rounded-xl shadow-md">
              {monthlyData.length === 0 ? (
                <p>No data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#7f1d1d" />
                    <YAxis stroke="#7f1d1d" />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin-front/registration-request">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg hover:bg-red-100 transition cursor-pointer">
                  <h4 className="font-semibold text-red-800">Review Registrations</h4>
                  <p className="text-sm text-red-600">
                    Approve or reject pending user registrations
                  </p>
                </div>
              </Link>
              <Link href="/admin-front/announcement">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition cursor-pointer">
                  <h4 className="font-semibold text-red-800">Manage Announcements</h4>
                  <p className="text-sm text-red-600">
                    Create, edit, or delete system announcements
                  </p>
                </div>
              </Link>
              <Link href="/admin-front/reports">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition cursor-pointer">
                  <h4 className="font-semibold text-red-800">View Reports</h4>
                  <p className="text-sm text-red-600">
                    Access detailed system reports and analytics
                  </p>
                </div>
              </Link>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow p-6">
              {recentActivity.length === 0 ? (
                <p>No recent requests.</p>
              ) : (
                <ul className="space-y-3">
                  {recentActivity.map((req) => (
                    <li
                      key={req.request_id}
                      className="border-b last:border-none pb-2 flex justify-between"
                    >
                      <span>
                        <strong className="text-red-900">{req.resident.first_name} {req.resident.last_name}</strong> requested a{" "}
                        <span className="text-red-600 font-medium">{req.certificate_type}</span>
                      </span>
                      <span className="text-sm text-red-900">
                        {new Date(req.requested_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
