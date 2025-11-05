"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationDropdown from "../../components/NotificationDropdown"; // Assuming this component exists
import { Role, RegistrationStatus } from "@prisma/client";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  UsersIcon,
  ClipboardDocumentIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

// Add this interface definition
interface Notification {
  notification_id: number;
  type: string; // e.g., 'certificate_request', 'complaint', 'announcement'
  message: string;
  is_read: boolean;
  created_at: string;
}

interface RegistrationRequest {
  request_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  role: Role;
  status: RegistrationStatus;
  contact_no?: string | null;
  birthdate: string;
}

export default function ApproveRegistrationPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("approve-registrations");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [message, setMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | null;
    id: number | null;
    step: "confirm" | "success" | null;
  }>({ type: null, id: null, step: null });
  const [fadeOut, setFadeOut] = useState(false); // for smooth fade

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "dashboard", label: "Home", icon: HomeIcon },
    { name: "manage-users", label: "Manage Users", icon: UsersIcon },
    { name: "approve-registrations", label: "Approve Registrations", icon: ClipboardDocumentIcon },
  ];

  useEffect(() => {
    fetchNotifications();
    fetchPending();
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

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/auth/approve-registration");
      if (!res.ok) throw new Error("Failed to fetch pending registrations");
      const data: RegistrationRequest[] = await res.json();
      setRequests(data);
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Failed to load pending registrations");
    }
  };

  const handleAction = async (action: "approve" | "reject", id: number) => {
    try {
      const endpoint =
        action === "approve"
          ? "/api/auth/approve-registration"
          : "/api/auth/reject-registration";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approverId: 1 }), // replace with actual approverId
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `${action} failed`);

      setConfirmAction({ type: action, id, step: "success" });
      setMessage(data.message || `${action} successful`);
      setRequests((prev) => prev.filter((r) => r.request_id !== id));
    } catch (err) {
      console.error(`${action} failed:`, err);
      setMessage(`${action} failed. Please try again.`);
    }
  };

  // Auto-close modal with fade effect
  useEffect(() => {
    if (confirmAction.step === "success") {
      const fadeTimer = setTimeout(() => setFadeOut(true), 1000); // start fade
      const closeTimer = setTimeout(() => {
        setConfirmAction({ type: null, id: null, step: null });
        setFadeOut(false);
      }, 1500); // fully close

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [confirmAction.step]);

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
          <h1 className="text-xl font-semibold text-black">Approve Registrations</h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          <h2 className="text-2xl font-semibold mb-4">Pending Registrations</h2>

          {message && (
            <p className="text-center mb-4 bg-red-100 text-red-800 p-2 rounded">{message}</p>
          )}

          {requests.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No pending registrations 
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-800 border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-5 py-3 rounded-l-lg">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3 rounded-r-lg text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.request_id}
                      className="bg-white hover:bg-gray-50 transition rounded-lg shadow-sm"
                    >
                      <td className="px-5 py-3">
                        {req.first_name} {req.last_name}
                      </td>
                      <td className="px-5 py-3">
                        {req.email ?? "No email provided"}
                      </td>
                      <td className="px-5 py-3">{req.role}</td>
                      <td className="px-5 py-3 text-center space-x-2">
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: "approve",
                              id: req.request_id,
                              step: "confirm",
                            })
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105 inline-flex items-center gap-1"
                        >
                          <CheckIcon className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: "reject",
                              id: req.request_id,
                              step: "confirm",
                            })
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105 inline-flex items-center gap-1"
                        >
                          <XMarkIcon className="w-4 h-4" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {confirmAction.step && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-500"
          style={{ opacity: fadeOut ? 0 : 1 }}
        >
          <div
            className="bg-white border border-gray-300 rounded-2xl p-8 text-center max-w-sm transition-transform duration-500"
            style={{ transform: fadeOut ? "scale(0.95)" : "scale(1)" }}
          >
            {confirmAction.step === "confirm" && (
              <>
                <h2 className="text-xl mb-4 font-semibold text-gray-800">
                  {confirmAction.type === "approve"
                    ? "Approve this registration?"
                    : "Reject this registration?"}
                </h2>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() =>
                      handleAction(
                        confirmAction.type as "approve" | "reject",
                        confirmAction.id!
                      )
                    }
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() =>
                      setConfirmAction({ type: null, id: null, step: null })
                    }
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {confirmAction.step === "success" && (
              <h2 className="text-lg text-green-600">
                ✅ {confirmAction.type === "approve" ? "Approved" : "Rejected"} successfully!
              </h2>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
