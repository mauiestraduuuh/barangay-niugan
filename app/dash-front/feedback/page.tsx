"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import NotificationDropdown from "../../components/NotificationDropdown";
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
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
}

interface Feedback {
  feedback_id: number;
  status: string;
  response?: string | null;
  submitted_at: string;
  responded_at?: string | null;
  category?: {
    category_id: number;
    english_name: string;
    tagalog_name: string;
    group: string;
  } | null;
}

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Category {
  category_id: number;
  english_name: string;
  tagalog_name: string;
  group: string;
}

export default function FeedbackPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resident, setResident] = useState<Resident | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [language, setLanguage] = useState<"en" | "tl">("en");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const features = [
    { name: 'the-dash-resident', label: 'Home', icon: HomeIcon },
    { name: 'resident', label: 'Manage Profile', icon: UserIcon },
    { name: 'digital-id', label: 'Digital ID', icon: CreditCardIcon },
    { name: 'certificate-request', label: 'Certificates', icon: ClipboardDocumentIcon },
    { name: 'feedback', label: 'Feedback / Complain', icon: ChatBubbleLeftEllipsisIcon },
    { name: 'notifications', label: 'Notifications', icon: BellIcon },
  ];

  const fetchResident = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/dash/the-dash", { headers: { "x-user-id": user.id } });
      const data = await res.json();
      if (res.ok) setResident(data.resident);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFeedbackData = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/dash/feedback", { headers: { Authorization: `Bearer ${token}` } });
      setFeedbacks(res.data.feedbacks);
      setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    }
  };

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

  useEffect(() => {
    fetchResident();
    fetchFeedbackData();
    fetchNotifications();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const submitFeedback = async () => {
    if (!token) return setInfoMessage("Unauthorized");
    if (!selectedGroup) return setInfoMessage("Please select a complaint group");
    if (!selectedCategory) return setInfoMessage("Please select a complaint");
    if (!file) return setInfoMessage("Please upload a photo as proof");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("categoryId", selectedCategory.toString());
      formData.append("file", file);

      const res = await axios.post("/api/dash/feedback", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setFeedbacks([res.data.feedback, ...feedbacks]);
      setSelectedGroup("");
      setSelectedCategory("");
      setFile(null);
      setInfoMessage("Feedback submitted successfully");
    } catch (err) {
      console.error(err);
      setInfoMessage("Failed to submit feedback");
    }

    setLoading(false);
  };

  const groups = Array.from(new Set(categories.map(cat => cat.group))).filter(Boolean) as string[];
  const filteredCategories = selectedGroup ? categories.filter(cat => cat.group === selectedGroup) : [];

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-200 text-yellow-800";
      case "IN_PROGRESS": return "bg-blue-200 text-blue-800";
      case "RESOLVED": return "bg-green-200 text-green-800";
      default: return "";
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-16"} bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}>
        <div className="p-4 flex items-center justify-between">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <button onClick={toggleSidebar} className="block md:hidden text-black hover:text-red-700 focus:outline-none">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => {
              const href = `/dash-front/${name}`;
              const isActive = name === "feedback";
              return (
                <li key={name} className="mb-2">
                  <Link href={href}>
                    <span className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${isActive ? "text-red-700" : "text-black hover:text-red-700"}`}>
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />}
                      <Icon className={`w-6 h-6 mr-2 ${isActive ? "text-red-700" : "text-gray-600 group-hover:text-red-700"}`} />
                      {sidebarOpen && <span className={`${isActive ? "text-red-700" : "group-hover:text-red-700"}`}>{label}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4">
          <button className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>

        <div className="p-4 flex justify-center hidden md:flex">
          <button onClick={toggleSidebar} className="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center focus:outline-none transition-colors duration-200 shadow-sm">
            {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5 text-black" /> : <ChevronRightIcon className="w-5 h-5 text-black" />}
          </button>
        </div>
      </div>

      {/* Overlay for Mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button onClick={toggleSidebar} className="block md:hidden text-black hover:text-red-700 focus:outline-none">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Resident Dashboard</h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <img src={resident?.photo_url || "/default-profile.png"} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center text-black">Submit Feedback / Complain</h1>
            {infoMessage && <p className="text-center text-black font-semibold bg-yellow-100 p-2 rounded">{infoMessage}</p>}

            {/* Language toggle */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setLanguage("en")} className={`px-3 py-1 rounded ${language === "en" ? "bg-black text-white" : "bg-gray-200"}`}>English</button>
              <button onClick={() => setLanguage("tl")} className={`px-3 py-1 rounded ${language === "tl" ? "bg-black text-white" : "bg-gray-200"}`}>Tagalog</button>
            </div>

            {/* Group dropdown */}
            <div className="mb-4">
              <label className="block font-semibold mb-1 text-black">What is your complaint about?</label>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setSelectedCategory("");
                }}
                className="w-full border border-black p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
              >
                <option value="">Select a group</option>
                {groups.map((grp) => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>

            {/* Category dropdown */}
            {selectedGroup && (
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-black">Select a complaint</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full border border-black p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
                >
                  <option value="">Select a complaint</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {language === "en" ? cat.english_name : cat.tagalog_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* File upload */}
            <div className="mb-4">
              <label className="block font-semibold mb-1 text-black">Upload proof (photo)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border border-black p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            </div>

            <button
              onClick={submitFeedback}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-md hover:bg-red-600 transition duration-300"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>

            <h2 className="text-xl font-bold text-black mt-6">Your Feedbacks</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-black text-black">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Category</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Response</th>
                    <th className="p-2 border">Submitted At</th>
                    <th className="p-2 border">Responded At</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((fb) => (
                    <tr key={fb.feedback_id}>
                      <td className="p-2 border">
                        {fb.category ? (language === "en" ? fb.category.english_name : fb.category.tagalog_name) : "-"}
                      </td>
                      <td className={`p-2 border font-semibold rounded ${statusColor(fb.status)}`}>{fb.status.replace("_", " ")}</td>
                      <td className="p-2 border">{fb.response || "-"}</td>
                      <td className="p-2 border">{new Date(fb.submitted_at).toLocaleString()}</td>
                      <td className="p-2 border">{fb.responded_at ? new Date(fb.responded_at).toLocaleString() : "-"}</td>
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
