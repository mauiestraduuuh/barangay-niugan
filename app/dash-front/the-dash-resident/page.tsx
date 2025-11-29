"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
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

interface Announcement {
  announcement_id: number;
  title: string;
  content?: string;
  posted_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("the-dash-resident");
  const [resident, setResident] = useState<Resident | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [summary, setSummary] = useState({
    totalCertificates: 0,
    pendingCertificates: 0,
    totalFeedbacks: 0,
    pendingFeedbacks: 0,
  });

  const fetchDashboard = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/dash/the-dash-resident", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    const data = await res.json();
    setResident(data.resident);
    setAnnouncements(data.announcements);
    setSummary(data.summary);
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  fetchDashboard();
}, []);


  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth-front/login");
  };

  // Calculate expiry
  const getExpiry = (posted_at: string) => {
    const postedDate = new Date(posted_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = 14 - diff;
    return remaining > 0 ? remaining : 0;
  };

  const features = [
    { name: "the-dash-resident", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback / Complain", icon: ChatBubbleLeftEllipsisIcon },
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
        {/* Logo */}
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
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              </li>
            ))}
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
            {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5 text-black" /> : <ChevronRightIcon className="w-5 h-5 text-black" />}
          </button>
        </div>
      </div>
            {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar}></div>
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
          <h1 className="text-large font-bold ">Resident Dashboard</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto text-black">
          {/* Resident Info */}
          {resident && (
            <div className="flex items-center gap-4 mb-6">
              <img
                src={resident.photo_url || "/default-profile.png"}
                alt="Profile"
                className="w-16 h-16 rounded-full border"
              />
              <h1 className="text-3xl font-semibold">
                Welcome, {resident.first_name} {resident.last_name}!
              </h1>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-500">Total Certificates</p>
              <p className="text-2xl font-bold">{summary.totalCertificates}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-500">Pending Certificates</p>
              <p className="text-2xl font-bold">{summary.pendingCertificates}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-500">Total Feedbacks</p>
              <p className="text-2xl font-bold">{summary.totalFeedbacks}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-500">Pending Feedbacks</p>
              <p className="text-2xl font-bold">{summary.pendingFeedbacks}</p>
            </div>
          </div>

          {/* Announcements */}
          <section>
            <header className="mb-6">
              <h3 className="text-xl font-semibold">Announcements</h3>
            </header>
            {announcements.length === 0 ? (
              <p className="text-gray-500">No announcements yet.</p>
            ) : (
              <div className="space-y-6">
                {announcements.map((ann) => {
                  const daysLeft = getExpiry(ann.posted_at);
                  return (
                    <div key={ann.announcement_id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                      <h3 className="text-xl font-semibold mb-2">{ann.title}</h3>
                      <p className="text-black">{ann.content ?? "No content provided."}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Posted at: {new Date(ann.posted_at).toLocaleString()}
                      </p>
                      <p className={`text-sm font-medium mt-1 ${daysLeft <= 3 ? "text-red-600" : "text-green-600"}`}>
                        Expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
