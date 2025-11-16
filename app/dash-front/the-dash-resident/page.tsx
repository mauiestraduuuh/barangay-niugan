"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

interface Announcement {
  announcement_id: number;
  title: string;
  content?: string;
  posted_at: string;
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const [resident, setResident] = useState<Resident | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchResident();
    fetchAnnouncements();
  }, []);

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

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/dash/announcement");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const data: Announcement[] = await res.json();
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
    }
  };

  const features = [
    { name: 'the-dash-resident', label: 'Home', icon: HomeIcon },
    { name: 'resident', label: 'Manage Profile', icon: UserIcon },
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
                  href={`/dash-front/${name.replace('-', '-')}`} // Adjust paths as needed
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name
                      ? 'text-red-700'
                      : 'text-black hover:text-red-700'
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

          <section>
            <header className="mb-6">
              <h2 className="text-3xl font-semibold">Announcements</h2>
            </header>

            {announcements.length === 0 ? (
              <p className="text-gray-500">No announcements yet.</p>
            ) : (
              <div className="space-y-6">
                {announcements.map((ann) => (
                  <div
                    key={ann.announcement_id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                  >
                    <h3 className="text-xl font-semibold mb-2">{ann.title}</h3>
                    <p className="text-gray-700">{ann.content ?? "No content provided."}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Posted at: {new Date(ann.posted_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
