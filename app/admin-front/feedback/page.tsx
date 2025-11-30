"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  KeyIcon,
  BellIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Feedback {
  feedback_id: string;
  resident_id: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  response?: string;
  proof_file?: string | null;
  submitted_at?: string;
  resident: {
    first_name: string;
    last_name: string;
    contact_no?: string;
  };
  respondedBy?: { id: string | number } | null;
  category?: {
    category_id: string;
    english_name: string;
    tagalog_name: string;
    group?: string;
  } | null;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("feedback");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "" | "IN_PROGRESS" | "RESOLVED">("PENDING");
  const [groupFilter, setGroupFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [viewFeedback, setViewFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [modalImage, setModalImage] = useState<string | null | undefined>(null);
  const [categories, setCategories] = useState<{ category_id: string; english_name: string; tagalog_name: string; group?: string }[]>([]);
  const filteredFeedbacks = feedbacks.filter((f) => {
    return (
      (!statusFilter || f.status === statusFilter) &&
      (!groupFilter || f.category?.group === groupFilter) &&
      (!categoryFilter || f.category?.category_id === categoryFilter)
    );
  });

  const [ITEMS_PER_PAGE, setITEMS_PER_PAGE] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE);
  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  useEffect(() => {
    fetchFeedbackAndCategories();
  }, []);

  const fetchFeedbackAndCategories = async () => {
    if (!token) return setMessage("Unauthorized: No token");
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { feedback: fetchedFeedback, categories: fetchedCategories } = res.data;

      const mappedFeedbacks: Feedback[] = (fetchedFeedback || []).map((f: any) => ({
        ...f,
        respondedBy: f.responded_by ? { id: f.responded_by } : null,
      }));

      setFeedbacks(mappedFeedbacks);
      setCategories(fetchedCategories || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch feedbacks");
      setFeedbacks([]);
      setCategories([]);
    }
    setLoading(false);
  };

  const replyFeedback = async () => {
    if (!selectedFeedback || !token) return setMessage("Unauthorized");

    const formData = new FormData();
    formData.append("feedbackId", selectedFeedback.feedback_id);
    formData.append("response", replyText);
    if (replyFile) formData.append("file", replyFile);

    try {
      await axios.post("/api/admin/feedback", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setSelectedFeedback(null);
      setReplyText("");
      setReplyFile(null);
      fetchFeedbackAndCategories();
      setMessage("Reply sent successfully");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send reply");
    }
  };

  const updateStatus = async (feedbackId: string, status: string) => {
    if (!token) return setMessage("Unauthorized");
    try {
      await axios.put(
        "/api/admin/feedback",
        { feedbackId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFeedbackAndCategories();
      setMessage("Status updated successfully");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update status");
    }
  };

  const groups = Array.from(new Set(categories.map((c) => c.group).filter(Boolean)));

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-300 cursor-not-allowed opacity-60";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4 text-black">
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

      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold ">Complaints Management</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        <main className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
            <h3 className="text-large font-semibold text-black">Resident Complaints</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filter */}
              <label className="text-sm font-medium">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              {/* Group filter */}
              <label className="text-sm font-medium ml-2">Group:</label>
              <select
                value={groupFilter}
                onChange={(e) => {
                  setGroupFilter(e.target.value);
                  setCategoryFilter(""); // reset category
                }}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* Category filter */}
              {groupFilter && (
                <>
                  <label className="text-sm font-medium ml-2">Category:</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All</option>
                    {categories
                      .filter((c) => c.group === groupFilter)
                      .map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.english_name} / {c.tagalog_name}
                        </option>
                      ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {message && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-center font-medium">{message}</div>
          )}

          {loading ? (
            <p className="text-center text-black">Loading complaints...</p>
          ) : filteredFeedbacks.length === 0 ? (
            <p className="text-center text-black">No complaints available.</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white text-sm uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">Resident Name</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date Submitted</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Responded By</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-black divide-y divide-gray-200">
                    {paginatedFeedbacks.map((f) => (
                      <tr key={f.feedback_id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {f.resident?.first_name} {f.resident?.last_name}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={f.status}
                            onChange={(e) => updateStatus(f.feedback_id, e.target.value)}
                            disabled={f.status === "RESOLVED"}
                            className={`border rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 ${getStatusClass(
                              f.status
                            )}`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {f.submitted_at
                            ? new Date(f.submitted_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">{f.category ? `${f.category.english_name} / ${f.category.tagalog_name}` : "—"}</td>
                        <td className="px-4 py-3">{f.respondedBy ? `Admin #${f.respondedBy.id}` : "—"}</td>
                        <td className="px-4 py-3 text-center space-x-2">
                          <button
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition"
                            onClick={() => setViewFeedback(f)}
                          >
                            View
                          </button>
                          {f.status !== "RESOLVED" && (
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition"
                              onClick={() => {
                                setSelectedFeedback(f);
                                setReplyText(f.response || "");
                              }}
                            >
                              Reply
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {paginatedFeedbacks.map((f) => (
                  <div key={f.feedback_id} className="bg-gray-50 p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-black">{f.resident?.first_name} {f.resident?.last_name}</h3>
                      <select
                        value={f.status}
                        onChange={(e) => updateStatus(f.feedback_id, e.target.value)}
                        disabled={f.status === "RESOLVED"}
                        className={`border rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 ${getStatusClass(
                          f.status
                        )}`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                    <p className="text-xs text-black mb-1">
                      Submitted:{" "}
                      {f.submitted_at
                        ? new Date(f.submitted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    {f.category && (
                      <p className="text-xs text-black mb-2">
                        Category: {f.category.english_name} / {f.category.tagalog_name}
                      </p>
                    )}
                    <p className="text-xs text-black mb-2">{f.respondedBy ? `Admin #${f.respondedBy.id}` : "—"}</p>
                    <div className="flex gap-2">
                      <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm flex-1" onClick={() => setViewFeedback(f)}>
                        View
                      </button>
                      {f.status !== "RESOLVED" && (
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex-1"
                          onClick={() => {
                            setSelectedFeedback(f);
                            setReplyText(f.response || "");
                          }}
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
                                          {/* PAGINATION CONTROLS */}
              <div className="w-full mt-5 flex justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 ">

                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    ‹
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;

                    // Show only near numbers + first + last + ellipsis
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                            currentPage === page
                              ? "bg-red-100 text-red-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }

                    // Ellipsis (only render once)
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <div key={i} className="px-1 text-gray-400">
                          ...
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    ›
                  </button>

                  {/* Rows Per Page Dropdown */}
                  <select
                    value={ITEMS_PER_PAGE}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setITEMS_PER_PAGE(Number(e.target.value));
                    }}
                    className="ml-3 bg-white border border-gray-300 text-sm rounded-xl px-3 py-1 focus:ring-0"
                  >
                    <option value={2}>2 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Reply to {selectedFeedback.resident.first_name} {selectedFeedback.resident.last_name}
              </h3>
              <button onClick={() => setSelectedFeedback(null)} className="text-black hover:text-gray-700">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-black mb-4">
              Submitted:{" "}
              {selectedFeedback.submitted_at
                ? new Date(selectedFeedback.submitted_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </p>

            {selectedFeedback.response && (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-4">
                <p className="text-sm text-black font-medium">Existing Response:</p>
                <p className="text-sm text-black">{selectedFeedback.response}</p>
              </div>
            )}

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-2"
              rows={4}
            />
            <input type="file" onChange={(e) => setReplyFile(e.target.files?.[0] || null)} className="border rounded-md p-2 mb-4 w-full" />

            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedFeedback(null)} className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={replyFeedback} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                {selectedFeedback.response ? "Update Reply" : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Complaint from {viewFeedback.resident.first_name} {viewFeedback.resident.last_name}
              </h3>
              <button onClick={() => setViewFeedback(null)} className="text-black hover:text-gray-700">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
                {viewFeedback.proof_file ? (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1 text-black">Attached Proof:</p>
                    <img
                      src={viewFeedback.proof_file}
                      alt="Proof"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-black mb-4">No proof provided.</p>
                )}

            <p className="text-xs text-black mb-4">
              Submitted:{" "}
              {viewFeedback.submitted_at
                ? new Date(viewFeedback.submitted_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </p>

            {viewFeedback.category && (
              <p className="text-xs text-black mb-2">
                Category: {viewFeedback.category.english_name} / {viewFeedback.category.tagalog_name}
              </p>
            )}

            {viewFeedback.response && (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-4">
                <p className="text-sm text-black font-medium">Response:</p>
                <p className="text-sm text-black">{viewFeedback.response}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setViewFeedback(null)} className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {modalImage && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white p-4 rounded-lg max-w-lg w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Attached Proof</h3>
        <button
          onClick={() => setModalImage(null)}
          className="text-black hover:text-gray-700"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <img
        src={modalImage}
        alt="Proof"
        className="w-full rounded-lg border"
      />
    </div>
  </div>
)}
    </div>
  );
}
