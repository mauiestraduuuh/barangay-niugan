"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  MegaphoneIcon,
  BellIcon,
  Bars3Icon,
  ChevronLeftIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Staff {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PendingTasks {
  pendingRegistrations: number;
  pendingCertificates: number;
}

interface Activity {
  request_id: number;
  certificate_type: string;
  status: string;
  resident: { first_name: string; last_name: string };
  requested_at: string;
}

interface Announcement {
  announcement_id: number;
  title: string;
  posted_at: string;
  is_public: boolean;
}

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className={`${sizeClasses[size]} border-red-700 border-t-transparent rounded-full animate-spin`}></div>
  );
};

export default function StaffDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [pendingTasks, setPendingTasks] = useState<PendingTasks | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000ms = 5 minutes
    
    return () => clearInterval(interval);
  }, []);

 const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true); // Start loading
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth-front/login");
        return;
      }

      const res = await fetch("/api/staff/the-dash-staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch staff dashboard");

      setStaff(data.staff);
      setPendingTasks(data.pendingTasks);
      setRecentActivity(data.recentActivity || []);
      setRecentAnnouncements(data.recentAnnouncements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const features = [
    { name: "the-dash-staff", label: "Home", icon: HomeIcon },
    { name: "staff-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
  ];

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
        {/* Logo + Close */}
        <div className="p-4 flex items-center justify-center">
          <img
            src="/niugan-logo.png"
            alt="Logo"
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
              const href = `/staff-front/${name}`;
              const isActive = name === "the-dash-staff";
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
                        <span className={`${isActive ? "text-red-700" : "group-hover:text-red-700"}`}>
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

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex items-center justify-center relative rounded-xl text-black">
          {/* Mobile sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="block md:hidden absolute left-4 text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <h1 className="text-large font-bold text-left w-full">
            Staff Dashboard
          </h1>
        </header>

        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto text-black">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {staff && (
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold">{`Welcome back, ${staff.firstName} ${staff.lastName}!`}</h2>
                </div>
              )}

              {/* Overview Cards */}
              {pendingTasks && (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Pending Registrations", value: pendingTasks.pendingRegistrations },
                    { label: "Pending Certificates", value: pendingTasks.pendingCertificates },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
                      <h3 className="text-red-900">{item.label}</h3>
                      <p className="text-3xl font-bold text-red-700">{item.value}</p>
                    </div>
                  ))}
                </section>
              )}

              {/* Quick Actions */}
              <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/staff-front/registration-request">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg hover:bg-red-100 transition cursor-pointer">
                      <h4 className="font-semibold text-red-800">Review Registrations</h4>
                      <p className="text-sm text-red-600">Approve or reject pending resident registrations</p>
                    </div>
                  </Link>
                  <Link href="/staff-front/certificate-request">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition cursor-pointer">
                      <h4 className="font-semibold text-red-800">Process Certificates</h4>
                      <p className="text-sm text-red-600">Manage certificate requests and pickups</p>
                    </div>
                  </Link>
                  <Link href="/staff-front/announcement">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition cursor-pointer">
                      <h4 className="font-semibold text-red-800">Manage Announcements</h4>
                      <p className="text-sm text-red-600">Create, edit, or delete announcements</p>
                    </div>
                  </Link>
                </div>
              </section>

              {/* Recent Activity */}
              <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
                <div className="bg-white rounded-xl shadow p-6">
                  {recentActivity.length === 0 ? (
                    <p>No recent requests.</p>
                  ) : (
                    <ul className="space-y-3">
                      {recentActivity.map((req) => (
                        <li key={req.request_id} className="border-b last:border-none pb-2 flex justify-between">
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
