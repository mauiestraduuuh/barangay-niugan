"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  BellIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XCircleIcon,
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
  status: string;
  approvedBy?: { user_id: number; username: string } | null;
  address?: string;
  gender?: string;
  photo_url?: string;
  is_head_of_family?: boolean;
}

export default function AdminRegistrationRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("registration-request");
  const [message, setMessage] = useState("");
  const [viewRequest, setViewRequest] = useState<RegistrationRequest | null>(null);

  // Fetch token and admin_id from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const adminId = typeof window !== "undefined" ? Number(localStorage.getItem("admin_id")) : null;

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const fetchRequests = async () => {
    if (!token || !adminId) {
      setMessage("Unauthorized: Please login as admin");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/registration-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.pendingRequests || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch registration requests");
    }
    setLoading(false);
  };

  const handleApproveReject = async (requestId: number, approve: boolean) => {
  if (!token || !adminId) {
    setMessage("Unauthorized");
    return;
  }

  setLoading(true);
  try {
    const url = "/api/admin/registration-request"; // single backend route
    const payload = approve
      ? { request_id: requestId, approve: true, admin_id: adminId }
      : { request_id: requestId, approve: false, admin_id: adminId };

    await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    setMessage(approve ? "Request approved" : "Request rejected");
    setTimeout(() => setMessage(""), 3000);
  } catch (err: any) {
    console.error(err);
    setMessage(err.response?.data?.message || "Action failed");
    setTimeout(() => setMessage(""), 3000);
  }
  setLoading(false);
};


  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 rounded-xl flex justify-between items-center">
          <h1 className="text-xl font-semibold text-black">Registration Requests</h1>
          <BellIcon className="w-6 h-6 text-black" />
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
                    <p className="text-sm text-gray-600">{req.email || "N/A"}</p>
                    <p className="text-sm text-gray-600">{req.role}</p>
                    <p className="text-sm text-gray-500">{req.birthdate ? new Date(req.birthdate).toLocaleDateString() : "N/A"}</p>
                    {req.status !== "PENDING" && req.approvedBy && <p className="text-sm text-green-600">Approved by: {req.approvedBy.username}</p>}
                  </div>
                  <div className="flex gap-2">
                    {req.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApproveReject(req.request_id, true)}
                          disabled={loading}
                          className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <CheckIcon className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleApproveReject(req.request_id, false)}
                          disabled={loading}
                          className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-1 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <XCircleIcon className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setViewRequest(req)}
                      className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal for viewing request details */}
          {viewRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-lg w-1/2 relative">
                <button
                  onClick={() => setViewRequest(null)}
                  className="absolute top-3 right-3 text-gray-700 hover:text-red-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                <p><strong>Name:</strong> {viewRequest.first_name} {viewRequest.last_name}</p>
                <p><strong>Email:</strong> {viewRequest.email || "N/A"}</p>
                <p><strong>Contact:</strong> {viewRequest.contact_no || "N/A"}</p>
                <p><strong>Role:</strong> {viewRequest.role}</p>
                <p><strong>Birthdate:</strong> {viewRequest.birthdate ? new Date(viewRequest.birthdate).toLocaleDateString() : "N/A"}</p>
                <p><strong>Address:</strong> {viewRequest.address || "N/A"}</p>
                <p><strong>Gender:</strong> {viewRequest.gender || "N/A"}</p>
                <p><strong>Head of Family:</strong> {viewRequest.is_head_of_family ? "Yes" : "No"}</p>
                {viewRequest.photo_url && <img src={viewRequest.photo_url} alt="Photo" className="mt-4 w-32 h-32 object-cover rounded" />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
