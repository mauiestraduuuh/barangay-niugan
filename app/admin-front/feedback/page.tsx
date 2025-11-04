"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("feedback");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const features = [
    { name: "dashboard", label: "Home", icon: HomeIcon },
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

  return (
    <div className="min-h-screen flex gap-4 bg-gray-200 p-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 flex flex-col ${
          sidebarOpen ? "block" : "hidden"
        } md:block`}
      >
        <div className="p-4 flex items-center justify-between">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <button className="md:hidden" onClick={toggleSidebar}>
            <XMarkIcon className="w-6 h-6 text-black" />
          </button>
        </div>

        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link
                  href={`/admin-front/${name}`}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name ? "text-red-700" : "text-black hover:text-red-700"
                  }`}
                  onClick={() => setActiveItem(name)}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full ${
                      activeItem === name ? "block" : "hidden"
                    }`}
                  />
                  <Icon className="w-6 h-6 mr-2 group-hover:text-red-700" />
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 rounded-xl flex justify-between items-center">
          <h1 className="text-xl font-semibold text-black">Feedback Management</h1>
          <BellIcon className="w-6 h-6 text-black" />
        </header>

        <main className="bg-gray-50 p-6 rounded-xl shadow-sm overflow-auto">
          {message && <p className="text-center text-white bg-gray-900 p-2 rounded mb-4">{message}</p>}

          <div className="mb-4 flex gap-2 items-center">
            <label>Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : filteredFeedbacks.length === 0 ? (
            <p>No feedback available.</p>
          ) : (
            <div className="grid gap-4">
              {filteredFeedbacks.map((f) => (
                <div key={f.feedback_id} className="bg-white p-4 rounded shadow flex flex-col gap-2">
                  <p className="font-bold">{f.resident.first_name} {f.resident.last_name}</p>
                  <p>{f.message}</p>
                  <p>Status: <span className="font-semibold">{f.status}</span></p>
                  {f.response && <p>Response: {f.response}</p>}
                  <div className="flex gap-2 mt-2">
                    <select
                      value={f.status}
                      onChange={(e) => updateStatus(f.feedback_id, e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() => setSelectedFeedback(f)}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-lg font-bold mb-2">Reply to {selectedFeedback.resident.first_name}</h2>
            <textarea
              className="w-full border p-2 rounded mb-2"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
            />
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setSelectedFeedback(null)}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={replyFeedback}>
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
