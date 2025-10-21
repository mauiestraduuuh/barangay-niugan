"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  BellIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
}

interface Feedback {
  feedback_id: number;
  message: string;
  status: string;
  response?: string | null;
  responded_by?: number | null;
  submitted_at: string;
  responded_at?: string | null;
}

export default function FeedbackPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('feedback');
  const [resident, setResident] = useState<Resident | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchResident();
    if (!token) return;
    axios
      .get("/api/dash/feedback", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setFeedbacks(res.data.feedbacks))
      .catch((err) => console.error(err));
  }, [token]);

  const fetchResident = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/dash/the-dash", {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      if (res.ok) setResident(data.resident);
      else console.error(data.message);
    } catch (error) {
      console.error(error);
    }
  };

  const submitFeedback = async () => {
    if (!token) return setInfoMessage("Unauthorized");
    if (!message) return setInfoMessage("Message is required");
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/dash/feedback",
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbacks([res.data.feedback, ...feedbacks]);
      setMessage("");
      setInfoMessage("Feedback submitted successfully");
    } catch (err) {
      console.error(err);
      setInfoMessage("Failed to submit feedback");
    }
    setLoading(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-200 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-200 text-blue-800";
      case "RESOLVED":
        return "bg-green-200 text-green-800";
      default:
        return "";
    }
  };

  const features = [
    { name: 'home', label: 'Home', icon: HomeIcon },
    { name: 'manage-profile', label: 'Manage Profile', icon: UserIcon },
    { name: 'digital-id', label: 'Digital ID', icon: CreditCardIcon },
    { name: 'certificates', label: 'Certificates', icon: ClipboardDocumentIcon },
    { name: 'feedback', label: 'Feedback / Complain', icon: ChatBubbleLeftEllipsisIcon },
    { name: 'notifications', label: 'Notifications', icon: BellIcon },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'block' : 'hidden'
        } md:block md:relative md:translate-x-0 ${
          sidebarOpen ? 'fixed inset-y-0 left-0 z-50 md:static md:translate-x-0' : ''
        }`}
      >
        {/* Top Section */}
        <div className="p-4 flex items-center justify-between">
          <img
            src="/logo.png"
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
                  href={`/dash-front/${name.replace('-', '-')}`} 
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name ? 'text-red-700' : 'text-black hover:text-red-700'
                  }`}
                  onClick={() => setActiveItem(name)}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full ${
                      activeItem === name ? 'block' : 'hidden'
                    }`}
                  />
                  <Icon className="w-6 h-6 mr-2 group-hover:text-red-700" />
                  {sidebarOpen && (
                    <span className="group-hover:text-red-700">{label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Logout Button */}
        <div className="p-4">
          <button className="flex items-center gap-3 text-red-500 hover:text-red-700 transition w-full text-left">
            Log Out
          </button>
        </div>
        {/* Toggle Button (Desktop Only) - At the Bottom */}
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
      {/* Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
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
          <h1 className="text-xl font-semibold text-black">Resident Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="text-black hover:text-red-700 focus:outline-none">
              <BellIcon className="w-6 h-6" />
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <img
                src={resident?.photo_url || "/default-profile.png"}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center text-black">Submit Feedback / Complain</h1>
            {infoMessage && (
              <p className="text-center text-black font-semibold bg-yellow-100 p-2 rounded">
                {infoMessage}
              </p>
            )}
            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your feedback or complaint"
                className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
                rows={4}
              />
              <button
                onClick={submitFeedback}
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-md hover:bg-red-600 transition duration-300"
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
            <h2 className="text-xl font-bold text-black mt-6">Your Feedbacks</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-black text-black">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Message</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Response</th>
                    <th className="p-2 border">Submitted At</th>
                    <th className="p-2 border">Responded At</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((fb) => (
                    <tr key={fb.feedback_id}>
                      <td className="p-2 border">{fb.message}</td>
                      <td className={`p-2 border font-semibold rounded ${statusColor(fb.status)}`}>
                        {fb.status.replace("_", " ")}
                      </td>
                      <td className="p-2 border">{fb.response || "-"}</td>
                      <td className="p-2 border">{new Date(fb.submitted_at).toLocaleString()}</td>
                      <td className="p-2 border">
                        {fb.responded_at ? new Date(fb.responded_at).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
