"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
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
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface RegistrationRequest {
  request_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  contact_no?: string;
  birthdate?: string;
  role: "RESIDENT" | "STAFF";
  submitted_at: string;
}
interface Notification {
  notification_id: number;
  type: string; 
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminRegistrationRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("registration-requests");
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!token) return setMessage("Unauthorized: No token");
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/registration-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.pendingRequests);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch registration requests");
    }
    setLoading(false);
  };
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

  const handleApproveReject = async (requestId: number, approve: boolean) => {
    if (!token) return setMessage("Unauthorized");
    try {
      await axios.post(
        "/api/admin/registration-request",
        { request_id: requestId, approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      setMessage(approve ? "Request approved" : "Request rejected");
    } catch (err) {
      console.error(err);
      setMessage("Action failed");
    }
  };

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

    const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

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
                const isActive = name === "registration-request";
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
         {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Registration Management</h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        <main className="bg-gray-50 p-6 rounded-xl shadow-sm overflow-auto">
          {message && <p className="text-center text-white bg-gray-900 p-2 rounded mb-4">{message}</p>}

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-center">No pending registration requests</p>
          ) : (
            <div className="grid gap-4">
              {requests.map((req) => (
                <div key={req.request_id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <p className="font-bold">{req.first_name} {req.last_name}</p>
                    <p className="text-sm text-gray-600">{req.email}</p>
                    <p className="text-sm text-gray-600">{req.role}</p>
                    <p className="text-sm text-gray-500">{new Date(req.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveReject(req.request_id, true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"
                    >
                      <CheckIcon className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleApproveReject(req.request_id, false)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-1"
                    >
                      <XCircleIcon className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
