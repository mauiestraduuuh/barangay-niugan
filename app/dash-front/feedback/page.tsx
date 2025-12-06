"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
}

interface Feedback {
  feedback_id: number;
  status: "PENDING" | "IN PROGRESS" | "RESOLVED" ;
  response?: string | null;
  submitted_at: string;
  proof_file? : string;
  responded_at?: string | null;
  category?: {
    category_id: number;
    english_name: string;
    tagalog_name: string;
    group: string;
  } | null;
}

interface Category {
  category_id: number;
  english_name: string;
  tagalog_name: string;
  group: string;
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

export default function FeedbackPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("submit"); 
  const [resident, setResident] = useState<Resident | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [infoMessage, setInfoMessage] = useState("");
  const [activeItem, setActiveItem] = useState("feedback");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "" | "IN PROGRESS" | "RESOLVED">("PENDING");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [language, setLanguage] = useState<"en" | "tl">("en");
  const [modalImage, setModalImage] = useState<string | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const features = [
    { name: "the-dash-resident", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Complaint", icon: ChatBubbleLeftEllipsisIcon },
  ];


  const fetchResident = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/dash/the-dash", { headers: { "x-user-id": user.id } });
      const data = await res.json();
      if (res.ok) setResident(data.resident);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFeedbackData = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/dash/feedback", { headers: { Authorization: `Bearer ${token}` } });
      setFeedbacks(res.data.feedbacks);
      setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      await Promise.all([fetchResident(), fetchFeedbackData()]);
      setPageLoading(false);
    };
    loadData();
  }, [token]);


  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      await Promise.all([fetchResident(), fetchFeedbackData()]);
      setPageLoading(false);
    };
    loadData();
  }, [token]);

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);  
    setSelectedFile(uploadedFile); 
  }
};

  const submitFeedback = async () => {
    if (!token) return setInfoMessage("Unauthorized");
    if (!selectedGroup) return setInfoMessage("Please select a complaint group");
    if (!selectedCategory) return setInfoMessage("Please select a complaint");
    if (!file) return setInfoMessage("Please upload a photo as proof");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("categoryId", selectedCategory.toString());
      formData.append("file", file);

      const res = await axios.post("/api/dash/feedback", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setFeedbacks([res.data.feedback, ...feedbacks]);
      setSelectedGroup("");
      setSelectedCategory("");
      setFile(null);
      setSelectedFile(null);
      setInfoMessage("Feedback submitted successfully");
    setTimeout(() => {
      setInfoMessage("");
    }, 3000);
    if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setInfoMessage("Failed to submit feedback");
        setTimeout(() => {
        setInfoMessage("");
      }, 3000);
    }

    setLoading(false);
  };

  useEffect(() => {
  filterRequests();
}, [statusFilter, feedbacks]);

  useEffect(() => {
      const interval = setInterval(() => {
        window.location.reload();
      }, 300000);
      
      return () => clearInterval(interval);
    }, []);

const filterRequests = () => {
  let filtered = [...feedbacks];
  if (statusFilter !== "") {
    filtered = filtered.filter((r) => r.status === statusFilter);
  }
  setFilteredFeedbacks(filtered);
};

  const groups = Array.from(new Set(categories.map(cat => cat.group))).filter(Boolean) as string[];
  const filteredCategories = selectedGroup ? categories.filter(cat => cat.group === selectedGroup) : [];

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-600";
      case "IN_PROGRESS": return "text-blue-600";
      case "RESOLVED": return " text-green-600";
      default: return "";
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
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

     {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

      {/* Main Section */} 
      <div className="flex-1 flex flex-col gap-4 w-full overflow-hidden">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold">Complaints Management</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        <div className="relative">
          {/* Folder Tabs */}
          <div className="absolute top-0 right-3 flex space-x-2 text-black">
            <button
              className={`px-4 py-1 rounded-t-lg font-medium
                ${activeTab === 'submit' ? 'bg-white text-red-700 font-semibold border-b-white' : 'bg-gray-100 opacity-70'}`}
              onClick={() => setActiveTab('submit')}
            >
              SUBMIT COMPLAINTS
            </button>

            <button
              className={`px-4 py-1 rounded-t-lg b font-medium
                ${activeTab === 'history' ? 'bg-white  text-red-700 font-semibold border-b-white' : 'bg-gray-100 opacity-70'}`}
              onClick={() => setActiveTab('history')}
            >
              HISTORY
            </button>
          </div>

          {/* Main Content */}
          <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto mt-8">
            <div className="space-y-6">
              {/* SUBMIT TAB */}
              {activeTab === "submit" && (
                <div className="space-y-6">
                  {infoMessage && (
                    <p className="text-center text-gray-700 font-medium bg-yellow-100 border border-yellow-300 p-3 rounded-lg shadow-sm">
                      {infoMessage}
                    </p>
                  )}

                  {pageLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <LoadingSpinner size="lg" />
                      <p className="text-gray-600">Loading complaint form...</p>
                    </div>
                  ) : (
                    // Loaded content
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Container: Complaints Form */}
                      <div className="flex-1 bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
                        <h3 className="text-large font-semibold text-gray-800 mb-4">Complaint Details</h3>

                        {/* Language toggle */}
                        <div className="flex gap-3 mb-6">
                          <button
                            onClick={() => setLanguage("en")}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              language === "en" ? "bg-gradient-to-br from-black via-red-800 to-black text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            English
                          </button>
                          <button
                            onClick={() => setLanguage("tl")}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              language === "tl" ? "bg-gradient-to-br from-black via-red-800 to-black text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            Tagalog
                          </button>
                        </div>

                        {/* Group dropdown */}
                        <div className="mb-6">
                          <label className="block font-semibold mb-2 text-gray-700">
                            What is your complaint about?
                          </label>
                          <select
                            value={selectedGroup}
                            onChange={(e) => {
                              setSelectedGroup(e.target.value);
                              setSelectedCategory("");
                            }}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-700 bg-white shadow-sm transition-all duration-200"
                          >
                            <option value="">Select a group</option>
                            {groups.map((grp) => (
                              <option key={grp} value={grp}>
                                {grp}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Category dropdown */}
                        {selectedGroup && (
                          <div className="mb-6">
                            <label className="block font-semibold mb-2 text-gray-700">
                              Select a complaint
                            </label>
                            <select
                              value={selectedCategory}
                              onChange={(e) =>
                                setSelectedCategory(e.target.value ? parseInt(e.target.value) : "")
                              }
                              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-700 bg-white shadow-sm transition-all duration-200"
                            >
                              <option value="">Select a complaint</option>
                              {filteredCategories.map((cat) => (
                                <option key={cat.category_id} value={cat.category_id}>
                                  {language === "en" ? cat.english_name : cat.tagalog_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Right Container: Proof Section */}
                      <div className="flex-1 bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
                        <h3 className="text-large font-semibold text-gray-800 mb-4">Proof of Complaint</h3>

                        <div className="mb-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="w-full border border-gray-300 p-3 rounded-lg text-gray-700 bg-white shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />

                            {selectedFile && (
                              <button
                                onClick={() => {
                                  setSelectedFile(null);
                                  setFile(null);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                  }
                                }}
                                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {selectedFile ? (
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Uploaded proof"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-lg font-medium">Add Photo Proof</p>
                            <p className="text-sm">Upload an image to support your complaint</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={submitFeedback}
                      disabled={loading || pageLoading}
                      className="px-4 py-2 bg-gradient-to-br from-black via-red-800 to-black text-white py-3 rounded-lg font-semibold hover:from-red-700 transition-all duration-200 shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading && <LoadingSpinner size="sm" />}
                      {loading ? "Submitting..." : "Submit Complaint"}
                    </button>
                  </div>
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === "history" && (
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-large sm:text-large font-bold text-gray-800 tracking-tight">
                      Complaint History
                    </h3>

                    <div className="flex items-center gap-3">
                      <label className="text-xs sm:text-sm font-semibold text-gray-600">Filter Status:</label>

                      <div className="relative">
                        <select
                          className="appearance-none bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 pr-8 text-xs sm:text-sm font-medium text-gray-700 shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                          <option value="">All Statuses</option>
                          <option value="PENDING">Pending</option>
                          <option value="IN PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
                    <table className="min-w-full border-collapse text-left bg-white shadow-sm rounded-xl overflow-hidden text-xs sm:text-sm md:text-base">
                      <thead>
                        <tr className="bg-gradient-to-br from-black via-red-800 to-black text-white uppercase font-semibold text-xs sm:text-sm">
                          <th className="p-3 sm:p-4 border-b border-gray-200">Category</th>
                          <th className="p-3 sm:p-4 border-b border-gray-200">Status</th>
                          <th className="p-3 sm:p-4 border-b border-gray-200">Response</th>
                          <th className="p-3 sm:p-4 border-b border-gray-200">Proof</th>
                          <th className="p-3 sm:p-4 border-b border-gray-200">Submitted At</th>
                          <th className="p-3 sm:p-4 border-b border-gray-200">Responded At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageLoading ? (
                          <tr>
                            <td colSpan={6} className="p-12">
                              <div className="flex flex-col items-center justify-center gap-4">
                                <LoadingSpinner size="lg" />
                                <p className="text-gray-600">Loading complaint history...</p>
                              </div>
                            </td>
                          </tr>
                        ) : filteredFeedbacks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500">
                              No complaints found
                            </td>
                          </tr>
                        ) : (
                          filteredFeedbacks.map((fb) => (
                            <tr key={fb.feedback_id} className="hover:bg-gray-50 transition-colors duration-200 text-black text-xs sm:text-sm md:text-base">
                              <td className="p-2 sm:p-4 border-b border-gray-200">
                                {fb.category ? (language === "en" ? fb.category.english_name : fb.category.tagalog_name) : "-"}
                              </td>
                              <td className={`p-2 sm:p-4 border-b border-gray-200 font-semibold text-center rounded-md ${statusColor(fb.status)}`}>
                                {fb.status.replace("_", " ")}
                              </td>
                              <td className="p-2 sm:p-4 border-b border-gray-200">{fb.response || "-"}</td>
                              <td className="p-2 sm:p-4 border-b border-gray-200 text-center">
                                {fb.proof_file ? (
                                  <button
                                    onClick={() => fb.proof_file && setModalImage(fb.proof_file)}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium underline transition-colors duration-200 text-xs sm:text-sm"
                                  >
                                    View Proof
                                  </button>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 sm:p-4 border-b border-gray-200">{new Date(fb.submitted_at).toLocaleString()}</td>
                              <td className="p-2 sm:p-4 border-b border-gray-200">
                                {fb.responded_at ? new Date(fb.responded_at).toLocaleString() : "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal for Proof Image */}
                  {modalImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalImage(null)}>
                      <div className="bg-white p-4 rounded-xl shadow-xl max-w-lg max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <img src={modalImage} alt="Proof" className="w-full h-auto rounded-lg" />
                        <button onClick={() => setModalImage(null)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200">Close</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
      </div>
    </div>
    </div>
  );
}
