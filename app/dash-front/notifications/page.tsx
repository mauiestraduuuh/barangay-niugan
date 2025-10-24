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

interface Notification {
  notification_id: number;
  type: string; // e.g., 'certificate_request', 'complaint', 'announcement'
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('notifications');
  const [resident, setResident] = useState<Resident | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchResident();
    fetchNotifications();
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const recentNotifications = notifications.slice(0, 5); // Show top 5 recent

  const features = [
    { name: 'the-dash-resident', label: 'Home', icon: HomeIcon },
    { name: 'resident', label: 'Manage Profile', icon: UserIcon },
    { name: 'digital-id', label: 'Digital ID', icon: CreditCardIcon },
    { name: 'certificate-request', label: 'Certificates', icon: ClipboardDocumentIcon },
    { name: 'feedback', label: 'Feedback / Complain', icon: ChatBubbleLeftEllipsisIcon },
    { name: 'notifications', label: 'Notifications', icon: BellIcon },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

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
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl relative">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Resident Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="text-black hover:text-red-700 focus:outline-none relative"
              >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Recent Notifications</h3>
                    {recentNotifications.length === 0 ? (
                      <p className="text-gray-500">No notifications yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {recentNotifications.map((notif) => (
                          <li key={notif.notification_id} className={`p-2 rounded ${notif.is_read ? 'bg-gray-100' : 'bg-blue-50'}`}>
                            <p className="text-sm font-medium">{notif.type.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-sm">{notif.message}</p>
                            <p className="text-xs text-gray-400">{new Date(notif.created_at).toLocaleString()}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
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
          <h1 className="text-2xl font-bold text-black mb-6">Notifications</h1>
          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications yet.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.notification_id} className={`p-4 rounded-lg shadow ${notif.is_read ? 'bg-white' : 'bg-blue-50 border-l-4 border-blue-500'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{notif.type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-black">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                    {!notif.is_read && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">New</span>
                    )}
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
