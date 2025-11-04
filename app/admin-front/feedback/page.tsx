"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface Notification {
  notification_id: number;
  type: string; // e.g., 'certificate_request', 'complaint', 'announcement'
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Feedback {
  feedback_id: string;
  resident_id: string;
  message: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  response?: string;
  resident: { first_name: string; last_name: string; contact_no?: string };
  responded_by?: string | null;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("feedback");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    if (!token) return setMessage("Unauthorized: No token");
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(res.data.feedbacks);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch feedbacks");
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

  const updateStatus = async (feedbackId: string, status: string) => {
    if (!token) return setMessage("Unauthorized");
    try {
      await axios.put(
        "/api/admin/feedback",
        { feedbackId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFeedbacks();
      setMessage("Status updated");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update status");
    }
  };

  const replyFeedback = async () => {
    if (!selectedFeedback || !token) return;
    try {
      await axios.post(
        "/api/admin/feedback",
        { feedbackId: selectedFeedback.feedback_id, response: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedFeedback(null);
      setReplyText("");
      fetchFeedbacks();
      setMessage("Reply sent");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send reply");
    }
  };

  const filteredFeedbacks = statusFilter
    ? feedbacks.filter((f) => f.status === statusFilter)
    : feedbacks;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  return (
    <div className="min-h-screen flex gap-4 bg-gray-200 p-4">

    {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}
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


      {/* Main content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
         <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
            <button
              onClick={toggleSidebar}
              className="block md:hidden text-black hover:text-red-700 focus:outline-none"
             >
            <Bars3Icon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-black">Feedback Management</h1>
            <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
              </div>
            </div>
          </header>

        <main className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
    <h2 className="text-2xl font-semibold text-gray-800">Resident Feedbacks</h2>

    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 font-medium">Filter by Status:</label>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <option value="">All</option>
        <option value="PENDING">Pending</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>
    </div>
  </div>

  {message && (
    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-center font-medium">
      {message}
    </div>
  )}

  {loading ? (
    <p className="text-center text-gray-500">Loading feedbacks...</p>
  ) : filteredFeedbacks.length === 0 ? (
    <p className="text-center text-gray-500">No feedback available.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-700 text-sm uppercase font-semibold">
          <tr>
            <th className="px-4 py-3 text-left">Resident</th>
            <th className="px-4 py-3 text-left">Message</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Comment</th>
            <th className="px-4 py-3 text-left">Notes</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700 divide-y divide-gray-200">
          {filteredFeedbacks.map((f) => (
            <tr key={f.feedback_id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                {f.resident.first_name} {f.resident.last_name}
              </td>
              <td className="px-4 py-3 max-w-xs truncate">{f.message}</td>
              <td className="px-4 py-3">
                <select
                  value={f.status}
                  onChange={(e) => updateStatus(f.feedback_id, e.target.value)}
                  className={`border rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 ${
                    f.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                      : f.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "bg-green-100 text-green-800 border-green-300"
                  }`}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <textarea
                  placeholder="Add a comment..."
                  className="w-full border border-gray-300 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  rows={2}
                ></textarea>
              </td>
              <td className="px-4 py-3">
                <textarea
                  placeholder="Add a note..."
                  className="w-full border border-gray-300 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  rows={2}
                ></textarea>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm transition"
                  onClick={() => setSelectedFeedback(f)}
                >
                  Reply
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

 {/* Reply Modal */}
{selectedFeedback && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Reply to {selectedFeedback.resident.first_name} {selectedFeedback.resident.last_name}
        </h3>
        <button
          onClick={() => setSelectedFeedback(null)}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Type your response..."
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
        rows={4}
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setSelectedFeedback(null)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Cancel
        </button>
        <button
          onClick={replyFeedback}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Send Reply
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
