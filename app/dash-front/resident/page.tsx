"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

interface ResidentProfile {
  resident_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  gender?: string;
  address?: string;
  contact_no?: string;
  email?: string;
  photo_url?: string;
}

export default function ResidentProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("manage-profile");
  const [profile, setProfile] = useState<ResidentProfile>({
    resident_id: 0,
    user_id: 0,
    first_name: "",
    last_name: "",
    birthdate: "",
    gender: "",
    address: "",
    contact_no: "",
    email: "",
    photo_url: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "edit" | "password">("overview");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) return setMessage("Unauthorized: No token found");
    try {
      const res = await axios.get("/api/dash/resident", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch profile");
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const updateProfile = async () => {
    if (!token) return setMessage("Unauthorized");
    setLoading(true);
    try {
      await axios.put("/api/dash/resident", profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Profile updated successfully");
      setActiveSection("overview");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile");
    }
    setLoading(false);
  };

  const changePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage("Passwords do not match");
      return;
    }
    if (!token) return setMessage("Unauthorized");
    setLoading(true);
    try {
      await axios.patch(
        "/api/dash/resident",
        {
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        },
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

  const features = [
    { name: "the-dash-resident", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback / Complain", icon: ChatBubbleLeftEllipsisIcon },
    { name: "notifications", label: "Notifications", icon: BellIcon },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
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
        <div className="p-4 flex items-center justify-between">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
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
                  {sidebarOpen && <span className="group-hover:text-red-700">{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4">
          <button className="flex items-center gap-3 text-red-500 hover:text-red-700 transition w-full text-left">
            Log Out
          </button>
        </div>

        {/* Collapse Toggle */}
        <div className="p-4 flex justify-center hidden md:flex">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center shadow-sm"
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
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Manage Profile</h1>
          <div className="flex items-center space-x-4">
            <BellIcon className="w-6 h-6 text-black hover:text-red-700" />
            <img
              src={profile.photo_url || "/default-profile.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border"
            />
          </div>
        </header>

        {/* Body */}
        <main className="bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          {message && (
            <p className="text-center text-white bg-gray-900 p-2 rounded mb-4">{message}</p>
          )}

          {activeSection === "overview" && (
            <div className="text-center space-y-4">
              <img
                src={profile.photo_url || "/default-profile.png"}
                alt="Profile"
                className="w-32 h-32 rounded-full mx-auto border object-cover"
              />
              <h2 className="text-2xl font-bold text-gray-800">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-gray-600">{profile.email || "No email provided"}</p>
              <p className="text-gray-600">{profile.address || "No address provided"}</p>
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setActiveSection("edit")}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Edit Information
                </button>
                <button
                  onClick={() => setActiveSection("password")}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}

          {activeSection === "edit" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Edit Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleProfileChange}
                  placeholder="First Name"
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleProfileChange}
                  placeholder="Last Name"
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="date"
                  name="birthdate"
                  value={profile.birthdate?.split("T")[0]}
                  onChange={handleProfileChange}
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="text"
                  name="contact_no"
                  value={profile.contact_no || ""}
                  onChange={handleProfileChange}
                  placeholder="Contact Number"
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="text"
                  name="address"
                  value={profile.address || ""}
                  onChange={handleProfileChange}
                  placeholder="Address"
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-md transition"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setActiveSection("overview")}
                  className="bg-gray-300 hover:bg-gray-400 text-black py-3 px-6 rounded-md transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeSection === "password" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
              <div className="space-y-4">
                <input
                  type="password"
                  name="current_password"
                  value={passwords.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Current Password"
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="password"
                  name="new_password"
                  value={passwords.new_password}
                  onChange={handlePasswordChange}
                  placeholder="New Password"
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="password"
                  name="confirm_password"
                  value={passwords.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Confirm New Password"
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={changePassword}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-md transition"
                >
                  {loading ? "Updating..." : "Change Password"}
                </button>
                <button
                  onClick={() => setActiveSection("overview")}
                  className="bg-gray-300 hover:bg-gray-400 text-black py-3 px-6 rounded-md transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
