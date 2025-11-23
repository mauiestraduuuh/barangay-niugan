"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  MegaphoneIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KeyIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

interface StaffProfile {
  user_id: number;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
  staff_id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: string | null;
  address: string | null;
  contact_no: string | null;
  photo_url: string | null;
  senior_mode: boolean;
  is_head_of_family: boolean;
  head_id: number | null;
  household_number: string | null;
  is_4ps_member: boolean;
  is_indigenous: boolean;
  is_slp_beneficiary: boolean;
  is_pwd: boolean;
  household_id: number | null;
}

export default function StaffProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("staff-profile");
  const [profile, setProfile] = useState<StaffProfile>({
    user_id: 0,
    username: "",
    role: "",
    created_at: "",
    updated_at: "",
    staff_id: 0,
    first_name: "",
    last_name: "",
    birthdate: "",
    gender: null,
    address: null,
    contact_no: null,
    photo_url: null,
    senior_mode: false,
    is_head_of_family: false,
    head_id: null,
    household_number: null,
    is_4ps_member: false,
    is_indigenous: false,
    is_slp_beneficiary: false,
    is_pwd: false,
    household_id: null,
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
    if (!token) {
      setMessage("Unauthorized: No token found");
      router.push("/auth-front/login");
      return;
    }

    try {
      const res = await axios.get("/api/staff/staff-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const staff = res.data.staff;

      if (!staff) {
        setMessage("Staff data not found");
        return;
      }

      // Flatten nested staff object
      const safeStaff: StaffProfile = {
        user_id: staff.user_id,
        username: staff.username,
        role: staff.role,
        created_at: staff.created_at,
        updated_at: staff.updated_at,
        staff_id: staff.staffs[0]?.staff_id ?? 0,
        first_name: staff.staffs[0]?.first_name ?? "",
        last_name: staff.staffs[0]?.last_name ?? "",
        birthdate: staff.staffs[0]?.birthdate ?? "",
        gender: staff.staffs[0]?.gender ?? null,
        address: staff.staffs[0]?.address ?? null,
        contact_no: staff.staffs[0]?.contact_no ?? null,
        photo_url: staff.staffs[0]?.photo_url ?? null,
        senior_mode: staff.staffs[0]?.senior_mode ?? false,
        is_head_of_family: staff.staffs[0]?.is_head_of_family ?? false,
        head_id: staff.staffs[0]?.head_id ?? null,
        household_number: staff.staffs[0]?.household_number ?? null,
        is_4ps_member: staff.staffs[0]?.is_4ps_member ?? false,
        is_indigenous: staff.staffs[0]?.is_indigenous ?? false,
        is_slp_beneficiary: staff.staffs[0]?.is_slp_beneficiary ?? false,
        is_pwd: staff.staffs[0]?.is_pwd ?? false,
        household_id: staff.staffs[0]?.household_id ?? null,
      };

      setProfile(safeStaff);
      setMessage("");
    } catch (err: any) {
      console.error("Fetch profile error:", err);
      setMessage(err.response?.data?.message || "Failed to fetch profile");
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setProfile({ ...profile, [name]: checked });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const updateProfile = async () => {
    if (!token) {
      setMessage("Unauthorized");
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        "/api/staff/staff-profile",
        {
          username: profile.username || undefined,
          first_name: profile.first_name || undefined,
          last_name: profile.last_name || undefined,
          birthdate: profile.birthdate || undefined,
          gender: profile.gender || undefined,
          address: profile.address || undefined,
          contact_no: profile.contact_no || undefined,
          photo_url: profile.photo_url || undefined,
          senior_mode: profile.senior_mode,
          is_head_of_family: profile.is_head_of_family,
          head_id: profile.head_id || undefined,
          household_number: profile.household_number || undefined,
          is_4ps_member: profile.is_4ps_member,
          is_indigenous: profile.is_indigenous,
          is_slp_beneficiary: profile.is_slp_beneficiary,
          is_pwd: profile.is_pwd,
          household_id: profile.household_id || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Profile updated successfully");
      setActiveSection("overview");
      fetchProfile();
    } catch (err: any) {
      console.error("Update profile error:", err);
      setMessage(err.response?.data?.message || "Failed to update profile");
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
      await axios.put(
        "/api/staff/staff-profile",
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

  // Staff features - NO analytics/reports/feedback/staff accounts (Requirement E)
  const features = [
    { name: "the-dash-staff", label: "Home", icon: HomeIcon },
    { name: "staff-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
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
            {features.map(({ name, label, icon: Icon }) => {
              const href = `/staff-front/${name}`;
              const isActive = name === "staff-profile";
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
                          isActive ? "text-red-700" : "text-gray-600 group-hover:text-red-700"
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
        <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar}></div>
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
          <h1 className="text-large font-bold">Manage Profile</h1>
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
                    src={profile.photo_url || "/default-profile.png"}
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
                      onClick={() => setActiveSection("edit")}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-full shadow-sm transition"
                    >
                      <UserIcon className="w-5 h-5" /> Edit Profile
                    </button>
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
                    { label: "Staff ID", value: profile.staff_id },
                    { label: "User ID", value: profile.user_id },
                    { label: "Gender", value: profile.gender ?? "N/A" },
                    { label: "Birthdate", value: profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : "N/A" },
                    { label: "Contact", value: profile.contact_no ?? "N/A" },
                    { label: "Address", value: profile.address ?? "N/A" },
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

          {activeSection === "edit" && (
            <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Profile</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleProfileChange}
                    placeholder="First Name"
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleProfileChange}
                    placeholder="Last Name"
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    type="text"
                    name="contact_no"
                    value={profile.contact_no ?? ""}
                    onChange={handleProfileChange}
                    placeholder="Contact Number"
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={profile.gender ?? ""}
                    onChange={handleProfileChange}
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={profile.address ?? ""}
                    onChange={handleProfileChange}
                    placeholder="Address"
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-4 mt-8">
                <button
                  onClick={() => {
                    setActiveSection("overview");
                    fetchProfile();
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-black font-medium py-3 px-6 rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full shadow-sm transition"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
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