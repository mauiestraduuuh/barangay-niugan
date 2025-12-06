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
  Bars3Icon,
  ChevronLeftIcon,
  EyeSlashIcon,
  EyeIcon,
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

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className={`${sizeClasses[size]} border-red-700 border-t-transparent rounded-full animate-spin`}></div>
  );
};

// Full Page Loading Overlay
const LoadingOverlay = ({ message = "Processing..." }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl flex flex-col items-center gap-4 shadow-2xl">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Skeleton Loading for Profile
const ProfileSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex flex-col md:flex-row items-center md:items-start bg-white shadow-lg rounded-2xl p-8 border border-gray-100 gap-6">
      <div className="w-36 h-36 rounded-full bg-gray-300"></div>
      <div className="flex-1 text-center md:text-left space-y-4">
        <div className="h-8 bg-gray-300 rounded w-64 mx-auto md:mx-0"></div>
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          <div className="h-10 bg-gray-200 rounded-full w-40"></div>
          <div className="h-10 bg-gray-200 rounded-full w-40"></div>
        </div>
      </div>
    </div>
    <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
      <div className="h-6 bg-gray-300 rounded w-48 mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg">
            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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

 const ConfirmationModal = ({
  message,
  details,
  onConfirm,
  onCancel,
  loading = false,
}: {
  message: string;
  details?: { label: string; value: string }[];
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-96 flex flex-col gap-4 shadow-2xl max-h-[80vh] overflow-auto">
      <p className="text-gray-800 font-medium">{message}</p>
      {details && details.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
          {details.map(({ label, value }) => (
            <p key={label} className="text-gray-700 text-sm mb-1">
              <span className="font-semibold">{label}:</span> {value || "N/A"}
            </p>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

const getChangedProfileFields = () => {
  const changes: { label: string; value: string }[] = [];

  if (editingProfile.first_name !== profile.first_name)
    changes.push({ label: "First Name", value: editingProfile.first_name });

  if (editingProfile.last_name !== profile.last_name)
    changes.push({ label: "Last Name", value: editingProfile.last_name });

  if ((editingProfile.birthdate?.split("T")[0] || "") !== (profile.birthdate?.split("T")[0] || ""))
    changes.push({ label: "Birthdate", value: editingProfile.birthdate.split("T")[0] });

  if ((editingProfile.contact_no || "") !== (profile.contact_no || ""))
    changes.push({ label: "Contact Number", value: editingProfile.contact_no || "" });

  if ((editingProfile.address || "") !== (profile.address || ""))
    changes.push({ label: "Address", value: editingProfile.address || "" });

  if (selectedFile) 
    changes.push({ label: "Profile Photo", value: selectedFile.name });

  return changes;
};


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [editingProfile, setEditingProfile] = useState(profile);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | "updateProfile" | "changePassword">(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [activeSection, setActiveSection] = useState<"overview" | "edit" | "password">("overview");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
  const t = localStorage.getItem("token");
  setToken(t);
}, []);

  useEffect(() => {
    if (activeSection === "edit") {
      setEditingProfile(profile);
    }
  }, [activeSection, profile]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleEditingProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingProfile({ ...editingProfile, [e.target.name]: e.target.value });
  };

useEffect(() => {
  if (token) {
    fetchProfile();
  }
}, [token]);


  const fetchProfile = async () => {
    if (!token) {
      setMessageType("error");
      setMessage("Unauthorized: No token found");
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    try {
      const res = await axios.get("/api/dash/resident", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setEditingProfile(res.data);
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to fetch profile");
    } finally {
      setPageLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const updateProfile = async () => {
    if (!token) {
      setMessageType("error");
      setMessage("Unauthorized");
      return;
    }

    setActionLoading(true);
    setLoadingMessage("Updating profile...");

    try {
      const formData = new FormData();
      formData.append("first_name", editingProfile.first_name);
      formData.append("last_name", editingProfile.last_name);
      formData.append("birthdate", editingProfile.birthdate);
      formData.append("contact_no", editingProfile.contact_no || "");
      formData.append("address", editingProfile.address || "");
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      const res = await axios.put("/api/dash/resident", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile(res.data);
      setEditingProfile(res.data);
      setSelectedFile(null);
      setMessageType("success");
      setMessage("Profile updated successfully");
      setActiveSection("overview");
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessage(err.response?.data?.error || "Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      setMessageType("error");
      setMessage("Passwords do not match");
      return;
    }
    if (!token) {
      setMessageType("error");
      setMessage("Unauthorized");
      return;
    }

    setActionLoading(true);
    setLoadingMessage("Changing password...");

    try {
      await axios.patch(
        "/api/dash/resident",
        {
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessageType("success");
      setMessage("Password updated successfully");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
      setActiveSection("overview");
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessage(err.response?.data?.error || "Failed to update password");
    } finally {
      setActionLoading(false);
    }
  };

  const features = [
    { name: "the-dash-resident", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Complaint", icon: ChatBubbleLeftEllipsisIcon },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
      {/* Loading Overlay */}
      {actionLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col 
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}
      >
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

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>

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

      {sidebarOpen && (
        <div className="fixed inset-0 bg-white/75 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

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

        <main className="bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          {message && (
            <p className={`text-center p-3 rounded-lg mb-4 font-medium ${
              messageType === "success" 
                ? "text-green-800 bg-green-100" 
                : "text-red-800 bg-red-100"
            }`}>
              {message}
            </p>
          )}

          {pageLoading ? (
            <ProfileSkeleton />
          ) : (
            <>
              {activeSection === "overview" && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center md:items-start bg-white shadow-lg rounded-2xl p-8 border border-gray-100 gap-6">
                    <div className="flex-shrink-0 relative">
                      <img
                        src={profile.photo_url || "/default-profile.png"}
                        alt="Profile"
                        className="w-36 h-36 rounded-full object-cover border-2 border-red-500 shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-profile.png";
                        }}
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-bold text-black">
                        {profile.first_name} {profile.last_name}
                      </h2>
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
                    <h3 className="text-large font-semibold text-black mb-6">Personal Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { label: "User ID", value: profile.user_id },
                        { 
                          label: "Birthdate", 
                          value: profile.birthdate ? profile.birthdate.split("T")[0] : "N/A" 
                        },
                        { label: "Email", value: profile.email || "N/A" },
                        { label: "Address", value: profile.address || "N/A" },
                        { label: "Contact Number", value: profile.contact_no || "N/A" },
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
                <div className="space-y-8 bg-white text-black shadow-lg rounded-xl p-8 mx-auto">
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
                        value={editingProfile.first_name}
                        onChange={handleEditingProfileChange}
                        placeholder="Enter your first name"
                        disabled={actionLoading}
                        className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition disabled:opacity-50"
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
                        value={editingProfile.last_name}
                        onChange={handleEditingProfileChange}
                        placeholder="Enter your last name"
                        disabled={actionLoading}
                        className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition disabled:opacity-50"
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
                        value={editingProfile.birthdate?.split("T")[0]}
                        onChange={handleEditingProfileChange}
                        disabled={actionLoading}
                        className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition disabled:opacity-50"
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
                        value={editingProfile.contact_no || ""}
                        onChange={handleEditingProfileChange}
                        placeholder="Enter contact number"
                        disabled={actionLoading}
                        className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition disabled:opacity-50"
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
                        value={editingProfile.address || ""}
                        onChange={handleEditingProfileChange}
                        placeholder="Enter your address"
                        disabled={actionLoading}
                        className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition disabled:opacity-50"
                      />
                    </div>

                   <div className="md:col-span-2">
                    <label className="block text-gray-600 font-medium mb-2">
                      Profile Picture
                    </label>
                    
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <img
                          src={
                            selectedFile 
                              ? URL.createObjectURL(selectedFile)
                              : editingProfile.photo_url || "/default-profile.png"
                          }
                          alt="Profile Preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/default-profile.png";
                          }}
                        />
                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                            disabled={actionLoading}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Button that triggers hidden file input */}
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('photo_url_input') as HTMLInputElement;
                          if (input) {
                            input.click();
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white py-2.5 px-6 rounded-xl font-medium shadow-sm transition cursor-pointer text-center w-full sm:w-auto"
                        disabled={actionLoading}
                      >
                        📸 Choose Photo
                      </button>
                      
                      {/* Hidden file input */}
                      <input
                        type="file"
                        id="photo_url_input"
                        accept="image/*"
                        onChange={(e) => {
                          console.log("File input triggered");
                          console.log("Files available:", e.target.files?.length);
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log("File selected:", file.name, file.size, file.type);
                            // Check file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              setMessageType("error");
                              setMessage("Image must be less than 5MB");
                              e.target.value = "";
                              return;
                            }
                            console.log("Setting file to state");
                            setSelectedFile(file);
                          } else {
                            console.log("No file found in input");
                          }
                        }}
                        style={{ display: 'none' }}
                        disabled={actionLoading}
                      />
                      
                      {selectedFile && (
                        <p className="text-sm text-gray-600 text-center">
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                  </div>

                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={() => setConfirmAction("updateProfile")}
                      disabled={actionLoading}
                      className="bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-xl font-medium shadow-md transition duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                    <button
                      onClick={() => setActiveSection("overview")}
                      disabled={actionLoading}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-8 rounded-xl font-medium shadow-md transition duration-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "password" && (
                <div className="space-y-8 bg-white text-black shadow-lg rounded-xl p-8 mx-auto">
                  <h2 className="text-3xl font-bold text-gray-800">Change Password</h2>

                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-gray-600 font-medium mb-1" htmlFor="current_password">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrent ? "text" : "password"}
                          id="current_password"
                          name="current_password"
                          value={passwords.current_password}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          disabled={actionLoading}
                          className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition disabled:opacity-50"
                        />
                        <button
                          key={showCurrent ? 'slash' : 'eye'}
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 opacity-0 group-focus-within:opacity-100 transition-opacity"
                          onClick={() => setShowCurrent(!showCurrent)}
                          >
                          {showCurrent ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-700" />
                          ) : (
                          <EyeIcon className="h-5 w-5 text-gray-700" />
                          )}
                          </button>
                          </div>
                          </div>
                          <div className="group">
                  <label className="block text-gray-600 font-medium mb-1" htmlFor="new_password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      id="new_password"
                      name="new_password"
                      value={passwords.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      disabled={actionLoading}
                      className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition disabled:opacity-50"
                    />
                    <button
                      key={showNew ? 'slash' : 'eye'}
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 opacity-0 group-focus-within:opacity-100 transition-opacity"
                      onClick={() => setShowNew(!showNew)}
                    >
                      {showNew ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-700" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-700" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-gray-600 font-medium mb-1" htmlFor="confirm_password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      id="confirm_password"
                      name="confirm_password"
                      value={passwords.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      disabled={actionLoading}
                      className="border border-gray-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-red-400 shadow-sm transition disabled:opacity-50"
                    />
                    <button
                      key={showConfirm ? 'slash' : 'eye'}
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 opacity-0 group-focus-within:opacity-100 transition-opacity"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-700" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-700" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setConfirmAction("changePassword")}
                  disabled={actionLoading}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-xl font-medium shadow-md transition duration-300 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
                <button
                  onClick={() => setActiveSection("overview")}
                  disabled={actionLoading}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-8 rounded-xl font-medium shadow-md transition duration-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {confirmAction && (
            <ConfirmationModal
              message={
                confirmAction === "updateProfile"
                  ? "Are you sure you want to update your profile information?"
                  : "Are you sure you want to change your password?"
              }
              details={
                confirmAction === "updateProfile"
                  ? getChangedProfileFields()
                  : [
                      { label: "Current Password", value: "********" },
                      { label: "New Password", value: passwords.new_password ? "********" : "" },
                    ]
              }
              onConfirm={() => {
                if (confirmAction === "updateProfile") updateProfile();
                else if (confirmAction === "changePassword") changePassword();
                setConfirmAction(null);
              }}
              onCancel={() => setConfirmAction(null)}
              loading={actionLoading}
            />
          )}
        </>
      )}
    </main>
  </div>
</div>
);
}