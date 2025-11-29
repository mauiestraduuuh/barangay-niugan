"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  Bars3Icon,
  ChevronLeftIcon,
  KeyIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

interface AdminProfile {
  user_id: number;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("admin-profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "password">("overview");
  const [profile, setProfile] = useState<AdminProfile>({
    user_id: 0,
    username: "",
    role: "",
    created_at: "",
    updated_at: "",
    first_name: "",
    last_name: "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) {
      setMessage("Unauthorized: No token found");
      return;
    }
    try {
      const res = await axios.get("/api/admin/admin-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const admin = res.data.admin;
      if (!admin) return setMessage("Admin data not found");

      setProfile({
        user_id: admin.user_id,
        username: admin.username,
        role: admin.role,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
        first_name: admin.first_name ?? "",
        last_name: admin.last_name ?? "",
      });
      setMessage("");
    } catch (err: any) {
      console.error("Fetch profile error:", err);
      setMessage(err.response?.data?.message || "Failed to fetch profile");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const changePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage("Passwords do not match");
      return;
    }
    if (!token) return setMessage("Unauthorized");
    setLoading(true);
    try {
      await axios.put(
        "/api/admin/admin-profile",
        { password: passwords.new_password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Password updated successfully");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
      setActiveSection("overview");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update password");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff-acc", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
      {/* Sidebar */}
                <div
                  className={`${
                    sidebarOpen ? "w-64" : "w-16"
                  } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col 
                  ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}
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
                      {features.map(({ name, label, icon: Icon }) => (
                        <li key={name} className="mb-2">
                          <Link
                            href={`/admin-front/${name}`}
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
          
                {/* Functional Logout Button */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold ">Manage Profile</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        {/* Body */}
        <main className="bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          {message && (
            <p className={`text-center p-2 rounded mb-4 ${message.includes("success") ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
              {message}
            </p>
          )}

          {/* Sections */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center md:items-start bg-white shadow-lg rounded-2xl p-8 border border-gray-100 gap-6">
                <div className="flex-shrink-0 relative">
                  <img
                    src="/default-profile.png"
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover border-4 border-red-500 shadow-md"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-black">{profile.first_name} {profile.last_name}</h2>
                  <p className="text-black text-sm mt-1">Role: {profile.role}</p>
                  <p className="text-black mt-2"><span className="font-semibold">Username:</span> {profile.username}</p>

                  <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => setActiveSection("password")}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2 rounded-full shadow-sm transition"
                    >
                      <LockClosedIcon className="w-5 h-5" /> Change Password
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
                <h3 className="text-xl font-semibold text-black mb-6">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: "User ID", value: profile.user_id },
                    { label: "Created At", value: new Date(profile.created_at).toLocaleDateString() },
                    { label: "Updated At", value: new Date(profile.updated_at).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200">
                      <p className="text-xs font-semibold text-black uppercase tracking-wide">{label}</p>
                      <p className="text-black mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "password" && (
            <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Change Password</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwords.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwords.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwords.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-4 mt-8">
                <button
                  onClick={() => setActiveSection("overview")}
                  className="bg-gray-300 hover:bg-gray-400 text-black font-medium py-3 px-6 rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  onClick={changePassword}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full shadow-sm transition"
                >
                  {loading ? "Updating..." : "Change Password"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
