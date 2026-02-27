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
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

interface StaffProfile {
  user_id: string | number;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
  staff_id: string | number;
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: string | null;
  address: string | null;
  contact_no: string | null;
  photo_url: string | null;
  senior_mode: boolean;
  is_head_of_family: boolean;
  head_id: string | number | null;
  household_number: string | null;
  is_4ps_member: boolean;
  is_indigenous: boolean;
  is_slp_beneficiary: boolean;
  is_pwd: boolean;
  household_id: string | number | null;
}

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-3", lg: "w-12 h-12 border-4" };
  return <div className={`${sizeClasses[size]} border-red-700 border-t-transparent rounded-full animate-spin`}></div>;
};

// Full Page Loading Overlay
const LoadingOverlay = ({ message = "Processing..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl flex flex-col items-center gap-4 shadow-2xl">
      <LoadingSpinner size="lg" />
      <p className="text-gray-700 font-medium">{message}</p>
    </div>
  </div>
);

// Confirmation Modal Component
const ConfirmationModal = ({
  title,
  details,
  onConfirm,
  onCancel,
}: {
  title: string;
  details: Record<string, string>;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {Object.entries(details).map(([field, value]) => (
          <div key={field} className="flex justify-between border-b border-gray-200 pb-1">
            <span className="font-medium text-gray-700">{field}</span>
            <span className="text-gray-900">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-4 mt-4 flex-wrap">
        <button
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-black font-medium py-2 px-4 rounded-full w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full w-full sm:w-auto"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default function StaffProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "edit" | "password">("overview");
  const [profile, setProfile] = useState<StaffProfile>({} as StaffProfile);
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
    current_password_show: false,
    new_password_show: false,
    confirm_password_show: false,
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [originalProfile, setOriginalProfile] = useState<StaffProfile>({} as StaffProfile);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) return router.push("/auth-front/login");
    setPageLoading(true);
    try {
      const res = await axios.get("/api/staff/staff-profile", { headers: { Authorization: `Bearer ${token}` } });
      const staff = res.data.staff;
      if (!staff) return setMessage("Staff data not found");

      const safeStaff: StaffProfile = {
        user_id: staff.user_id,
        username: staff.username,
        role: staff.role,
        created_at: staff.created_at,
        updated_at: staff.updated_at,
        staff_id: staff.staff_id ?? staff.staffs?.[0]?.staff_id ?? "",
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
      setOriginalProfile(safeStaff);
      setMessage("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setPageLoading(false);
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setProfile({ ...profile, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswords({ ...passwords, [e.target.name]: e.target.value });

  // Confirm Profile Update
  const confirmProfileUpdate = () => {
    const changes: Record<string, string> = {};
    
    Object.keys(profile).forEach((key) => {
      const newVal = (profile as any)[key];
      const oldVal = (originalProfile as any)[key];

      // Only include changed fields (ignore undefined/null if unchanged)
      if (newVal !== oldVal && !["photo_url", "senior_mode", "is_head_of_family"].includes(key)) {
        changes[
          key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
        ] = newVal ?? "N/A";
      }
    });

    if (Object.keys(changes).length === 0) {
      setMessage("No changes detected.");
      return;
    }

    setConfirmDetails(changes);
    setConfirmAction(() => updateProfile);
    setShowConfirmModal(true);
  };

  const updateProfile = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);
    try {
      await axios.put(
        "/api/staff/staff-profile",
        {
          username: profile.username || undefined,
          first_name: profile.first_name || undefined,
          last_name: profile.last_name || undefined,
          contact_no: profile.contact_no || undefined,
          gender: profile.gender || undefined,
          address: profile.address || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Profile updated successfully");
      setActiveSection("overview");
      fetchProfile();
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmPasswordChange = () => {
    setMessage(""); // Clear previous messages

    // Validate all fields are filled
    if (!passwords.current_password.trim()) {
      setMessage("Please enter your current password");
      return;
    }
    if (!passwords.new_password.trim()) {
      setMessage("Please enter a new password");
      return;
    }
    if (!passwords.confirm_password.trim()) {
      setMessage("Please confirm your new password");
      return;
    }

    // Validate password match
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage("New passwords do not match");
      return;
    }

    // Validate password length
    if (passwords.new_password.length < 6) {
      setMessage("New password must be at least 6 characters long");
      return;
    }

    // Check if new password is different
    if (passwords.current_password === passwords.new_password) {
      setMessage("New password must be different from current password");
      return;
    }

    setConfirmDetails({ 
      "Current Password": "********",
      "New Password": "********" 
    });
    setConfirmAction(() => changePassword);
    setShowConfirmModal(true);
  };

  const changePassword = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);
    setMessage(""); 

    try {
      const response = await axios.put(
        "/api/staff/staff-profile",
        { 
          password: passwords.new_password,
          current_password: passwords.current_password 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Success - clear form and show message
      setMessage("Password updated successfully");
      setPasswords({ 
        current_password: "", 
        new_password: "", 
        confirm_password: "",
        current_password_show: false,
        new_password_show: false,
        confirm_password_show: false
      });
      
      // Wait a moment before switching to overview
      setTimeout(() => {
        setActiveSection("overview");
        setMessage("");
      }, 2000);
      
    } catch (err: any) {
      // Enhanced error handling
      let errorMsg = "Failed to update password";
      
      if (err.response?.status === 401) {
        errorMsg = "Current password is incorrect";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setMessage(errorMsg);
      console.error("Password change error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000ms = 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-staff", label: "Home", icon: HomeIcon },
    { name: "staff-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          title="Confirm Changes"
          details={confirmDetails}
          onConfirm={confirmAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

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
        {/* Logo + Close */}
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
            {features.map(({ name, label, icon: Icon }) => {
              const href = `/staff-front/${name}`;
              const isActive = name === "staff-profile";
              return (
                <li key={name} className="mb-2">
                  <Link href={href}>
                    <span
                      className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                        isActive ? "text-red-700" : "text-black hover:text-red-700"
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
                        <span className={`${isActive ? "text-red-700" : "group-hover:text-red-700"}`}>
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
            {sidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5 text-black" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>}

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
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
            <p
              className={`text-center p-2 rounded mb-4 ${
                message.includes("success") ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"
              }`}
            >
              {message}
            </p>
          )}

          {pageLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading profile...</p>
            </div>
          ) : (
            <>
              {/* Sections */}
              {activeSection === "overview" && (
                <OverviewSection profile={profile} setActiveSection={setActiveSection} />
              )}
              {activeSection === "edit" && (
                <EditProfileSection
                  profile={profile}
                  handleProfileChange={handleProfileChange}
                  actionLoading={actionLoading}
                  setActiveSection={setActiveSection}
                  fetchProfile={fetchProfile}
                  confirmProfileUpdate={confirmProfileUpdate}
                />
              )}
              {activeSection === "password" && (
                <PasswordSection
                  passwords={passwords}
                  setPasswords={setPasswords}
                  handlePasswordChange={handlePasswordChange}
                  actionLoading={actionLoading}
                  setActiveSection={setActiveSection}
                  confirmPasswordChange={confirmPasswordChange}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* -------------------------- Child Components -------------------------- */

const OverviewSection = ({ profile, setActiveSection }: any) => (
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
        <h2 className="text-3xl font-bold text-black">
          {profile.first_name} {profile.last_name}
        </h2>
        <p className="text-black text-sm mt-1">Role: {profile.role}</p>
        <p className="text-black mt-2">
          <span className="font-semibold">Username:</span> {profile.username}
        </p>
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
          { label: "Staff ID", value: profile.staff_id, isHash: typeof profile.staff_id === "string" && (profile.staff_id as string).length > 16 },
          { label: "User ID", value: profile.user_id, isHash: typeof profile.user_id === "string" && (profile.user_id as string).length > 16 },
          { label: "Gender", value: profile.gender ?? "N/A", isHash: false },
          {
            label: "Birthdate",
            value: profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : "N/A",
            isHash: false,
          },
          { label: "Contact", value: profile.contact_no ?? "N/A", isHash: false },
          { label: "Address", value: profile.address ?? "N/A", isHash: false },
          { label: "Created At", value: new Date(profile.created_at).toLocaleDateString(), isHash: false },
          { label: "Updated At", value: new Date(profile.updated_at).toLocaleDateString(), isHash: false },
        ].map(({ label, value, isHash }) => (
          <div
            key={label}
            title={isHash ? String(value) : undefined}
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200 min-w-0 overflow-hidden"
          >
            <p className="text-xs font-semibold text-black uppercase tracking-wide truncate">{label}</p>
            <p className="text-black mt-1 text-sm truncate">
              {isHash ? `${String(value).slice(0, 16)}...` : String(value)}
            </p>
            {isHash && (
              <p className="text-xs text-gray-400 mt-1 italic"></p>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const EditProfileSection = ({
  profile,
  handleProfileChange,
  actionLoading,
  setActiveSection,
  fetchProfile,
  confirmProfileUpdate,
}: any) => (
  <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Profile</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { label: "First Name", name: "first_name", type: "text" },
        { label: "Last Name", name: "last_name", type: "text" },
        { label: "Contact Number", name: "contact_no", type: "text" },
        { label: "Gender", name: "gender", type: "select", options: ["", "Male", "Female"] },
        { label: "Address", name: "address", type: "text", full: true },
      ].map(({ label, name, type, options, full }: any) => (
        <div key={name} className={full ? "md:col-span-2" : ""}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
          {type === "select" ? (
            <select
              name={name}
              value={(profile as any)[name] ?? ""}
              onChange={handleProfileChange}
              className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
              disabled={actionLoading}
            >
              {options.map((opt: string) => (
                <option key={opt} value={opt}>
                  {opt || "Select Gender"}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              name={name}
              value={(profile as any)[name] ?? ""}
              onChange={handleProfileChange}
              placeholder={label}
              className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition"
              disabled={actionLoading}
            />
          )}
        </div>
      ))}
    </div>

    <div className="flex flex-wrap justify-end gap-4 mt-8">
      <button
        onClick={() => {
          setActiveSection("overview");
          fetchProfile();
        }}
        disabled={actionLoading}
        className="bg-gray-300 hover:bg-gray-400 text-black font-medium py-3 px-6 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        onClick={confirmProfileUpdate}
        disabled={actionLoading}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {actionLoading ? (
          <>
            <LoadingSpinner size="sm" /> Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </button>
    </div>
  </div>
);

const PasswordSection = ({
  passwords,
  setPasswords,
  handlePasswordChange,
  actionLoading,
  setActiveSection,
  confirmPasswordChange,
}: any) => (
  <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Change Password</h2>

    <div className="space-y-6">
      {[
        { label: "Current Password", name: "current_password" },
        { label: "New Password", name: "new_password" },
        { label: "Confirm New Password", name: "confirm_password" },
      ].map(({ label, name }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
          <div className="relative">
            <input
              type={(passwords as any)[`${name}_show`] ? "text" : "password"}
              name={name}
              value={(passwords as any)[name]}
              onChange={handlePasswordChange}
              placeholder={label}
              className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 w-full transition pr-12"
              disabled={actionLoading}
            />
            <button
              type="button"
              onClick={() =>
                setPasswords((prev: typeof passwords) => ({
                  ...prev,
                  [`${name}_show`]: !prev[`${name}_show` as keyof typeof prev],
                }))
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {(passwords as any)[`${name}_show`] ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap justify-end gap-4 mt-8">
      <button
        onClick={() => setActiveSection("overview")}
        disabled={actionLoading}
        className="bg-gray-300 hover:bg-gray-400 text-black font-medium py-3 px-6 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        onClick={confirmPasswordChange}
        disabled={actionLoading}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {actionLoading ? (
          <>
            <LoadingSpinner size="sm" /> Updating...
          </>
        ) : (
          "Change Password"
        )}
      </button>
    </div>
  </div>
);