"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  UsersIcon,
  ClipboardDocumentIcon,
  MegaphoneIcon,
  ChartBarIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  pendingRegistrations: number;
  totalAnnouncements: number;
  recentActivities: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("the-dash-admin");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingRegistrations: 0,
    totalAnnouncements: 0,
    recentActivities: 0,
  });
  const [loading, setLoading] = useState(true);

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
    fetchNotifications();
    fetchDashboardStats();
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

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch stats from APIs (adjust endpoints as needed)
      const [usersRes, regsRes, annRes] = await Promise.all([
        fetch("/api/admin/"), // change kung ano ung api for user count
        fetch("/api/auth/approve-registration"), // Get pending registrations
        fetch("/api/announcements"),
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : { count: 0 };
      const regsData = regsRes.ok ? await regsRes.json() : [];
      const annData = annRes.ok ? await annRes.json() : [];

      setStats({
        totalUsers: usersData.count || 0,
        pendingRegistrations: regsData.length || 0,
        totalAnnouncements: annData.length || 0,
        recentActivities: 5, // Placeholder, replace with actual recent activities count
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: "bg-blue-500",
      link: "/admin-front/manage-users",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: ExclamationCircleIcon,
      color: "bg-yellow-500",
      link: "/admin-front/registration-requests",
    },
    {
      title: "Announcements",
      value: stats.totalAnnouncements,
      icon: DocumentTextIcon,
      color: "bg-green-500",
      link: "/admin-front/manage-announcements",
    },
    {
      title: "Recent Activities",
      value: stats.recentActivities,
      icon: ChartBarIcon,
      color: "bg-purple-500",
      link: "/admin-front/reports",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-slate-50 p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"
        }`}
      >
        {/* Logo + Close */}
        <div className="p-4 flex items-center justify-between">
          <img
            src="/niugan-logo.png"
            alt="Company Logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6">
            <ul>
            {features.map(({ name, label, icon: Icon }) => {
                const href = `/admin-front/${name}`;
                const isActive = name === "the-dash-admin";
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
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Welcome, Admin!</h2>
            <p className="text-gray-600">Here's an overview of your system.</p>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading dashboard...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, index) => (
                <Link key={index} href={card.link} className="block">
                  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-full ${card.color}`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-gray-800">{card.value}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">{card.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Click to view details</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin-front/registration-request">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg hover:bg-red-100 transition cursor-pointer">
                  <h4 className="font-semibold text-red-800">Review Registrations</h4>
                  <p className="text-sm text-red-600">Approve or reject pending user registrations</p>
                </div>
              </Link>
              <Link href="/admin-front/manage-announcement">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition cursor-pointer">
                  <h4 className="font-semibold text-blue-800">Manage Announcements</h4>
                  <p className="text-sm text-blue-600">Create, edit, or delete system announcements</p>
                </div>
              </Link>
              <Link href="/admin-front/reports">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition cursor-pointer">
                  <h4 className="font-semibold text-green-800">View Reports</h4>
                  <p className="text-sm text-green-600">Access detailed system reports and analytics</p>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
