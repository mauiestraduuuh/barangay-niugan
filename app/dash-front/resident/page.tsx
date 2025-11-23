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
  LockClosedIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
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
  const [activeItem, setActiveItem] = useState("resident");
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
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth-front/login");
  };

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

      {/* Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-white/75 z-40 md:hidden" onClick={toggleSidebar}></div>
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
            <p className="text-center text-white bg-gray-900 p-2 rounded mb-4">{message}</p>
          )}

           {activeSection === "overview" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center md:items-start bg-white shadow-lg rounded-2xl p-8 border border-gray-100 gap-6">
                <div className="flex-shrink-0 relative">
                  <img
                    src={profile.photo_url || "/default-profile.png"}
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover border-2 border-red-500 shadow-md"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-black">{profile.first_name} {profile.last_name}</h2>
                  <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => setActiveSection("password")}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2 rounded-full shadow-sm transition"
                    >
                      <LockClosedIcon className="w-5 h-5" /> Change Password
                    </button>
                  <button
                  onClick={() => setActiveSection("edit")}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-full shadow-sm transition"
                >
                  <PencilIcon className="w-5 h-5" /> Edit Information
                </button>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
                <h3 className="text-xl font-semibold text-black mb-6">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: "User ID", value: profile.user_id },
                    { label: "Birthdate", value: profile.birthdate },
                    { label: "Email", value: profile.email },
                    { label: "Address", value: profile.address },
                    { label: "Contact Number", value: profile.contact_no },
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


      {activeSection === "edit" && (
        <div className="space-y-8 bg-white shadow-lg rounded-xl p-8  mx-auto">
          <h2 className="text-3xl font-bold text-gray-800">Edit Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 font-medium mb-1" htmlFor="first_name">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={profile.first_name}
                onChange={handleProfileChange}
                placeholder="Enter your first name"
                className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1" htmlFor="last_name">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={profile.last_name}
                onChange={handleProfileChange}
                placeholder="Enter your last name"
                className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1" htmlFor="birthdate">
                Birthdate
              </label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={profile.birthdate?.split("T")[0]}
                onChange={handleProfileChange}
                className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1" htmlFor="contact_no">
                Contact Number
              </label>
              <input
                type="text"
                id="contact_no"
                name="contact_no"
                value={profile.contact_no || ""}
                onChange={handleProfileChange}
                placeholder="Enter contact number"
                className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-600 font-medium mb-1" htmlFor="address">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={profile.address || ""}
                onChange={handleProfileChange}
                placeholder="Enter your address"
                className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition"
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={updateProfile}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-xl font-medium shadow-md transition duration-300"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setActiveSection("overview")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-8 rounded-xl font-medium shadow-md transition duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

                {activeSection === "password" && (
                  <div className="space-y-8 bg-white shadow-lg rounded-xl p-8 mx-auto">
                    <h2 className="text-3xl font-bold text-gray-800">Change Password</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-600 font-medium mb-1" htmlFor="current_password">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="current_password"
                          name="current_password"
                          value={passwords.current_password}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-600 font-medium mb-1" htmlFor="new_password">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="new_password"
                          name="new_password"
                          value={passwords.new_password}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password"
                          className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-600 font-medium mb-1" htmlFor="confirm_password">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirm_password"
                          name="confirm_password"
                          value={passwords.confirm_password}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                          className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 justify-end">
                      <button
                        onClick={changePassword}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-xl font-medium shadow-md transition duration-300"
                      >
                        {loading ? "Updating..." : "Change Password"}
                      </button>
                      <button
                        onClick={() => setActiveSection("overview")}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-8 rounded-xl font-medium shadow-md transition duration-300"
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
