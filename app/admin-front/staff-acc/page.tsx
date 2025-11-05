"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  UsersIcon,
  ClipboardDocumentIcon,
  MegaphoneIcon,
  ChartBarIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftEllipsisIcon,
  TrashIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

// Interfaces
interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Staff {
  staff_id: number;
  position: string;
  role: string;
  status: string;
  user: {
    name: string;
  };
}

export default function StaffAccounts() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});

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

  useEffect(() => {
    fetchNotifications();
    fetchStaff();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/dash/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Notification fetch failed:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      setStaffList(data);
    } catch (error) {
      console.error("Fetch staff failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    try {
      const res = await fetch("/api/admin/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: selectedStaff.staff_id }),
      });

      if (res.ok) {
        setStaffList(staffList.filter((s) => s.staff_id !== selectedStaff.staff_id));
        setShowDeleteModal(false);
        setSelectedStaff(null);
      } else {
        alert("Failed to delete staff.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleRating = (staffId: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [staffId]: rating }));
  };

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
            alt="Barangay Logo"
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
              const isActive = name === "staff-acc";
              return (
                <li key={name} className="mb-2">
                  <Link href={href}>
                    <span
                      className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                        isActive
                          ? "text-red-700 font-semibold"
                          : "text-black hover:text-red-700"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />
                      )}
                      <Icon
                        className={`w-6 h-6 mr-2 ${
                          isActive
                            ? "text-red-700"
                            : "text-gray-600 group-hover:text-red-700"
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

        {/* Sidebar Toggle */}
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
          <h1 className="text-xl font-semibold text-black">Staff Management</h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="bg-gray-50 p-6 rounded-xl shadow-md overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-600">Loading staff data...</p>
          ) : (
            <table className="w-full table-auto border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-300 text-gray-700">
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Performance</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr
                    key={staff.staff_id}
                    className="hover:bg-gray-100 transition"
                  >
                    <td className="py-3 px-4">{staff.staff_id}</td>
                    <td className="py-3 px-4">{staff.user?.name}</td>
                    <td className="py-3 px-4">{staff.role}</td>
                    <td className="py-3 px-4">{staff.position}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          staff.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          onClick={() => handleRating(staff.staff_id, star)}
                          className={`inline-block w-5 h-5 cursor-pointer transition ${
                            star <= (ratings[staff.staff_id] || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedStaff(staff);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <TrashIcon className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>

        {/* Delete Modal */}
        {showDeleteModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">
                Confirm Deletion
              </h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {selectedStaff.user?.name}
                </span>
                ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
