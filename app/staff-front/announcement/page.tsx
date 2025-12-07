"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  ClipboardDocumentIcon,
  MegaphoneIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KeyIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

// Announcement type
interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  posted_by: number;
  is_public: boolean;
  posted_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export default function ManageAnnouncements() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("announcement");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_public: true,
  });
  const [showExpired, setShowExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0,
  });
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [confirmModal, setConfirmModal] = useState<{
  visible: boolean;
  action: "submit" | "delete" | null;
  payload?: any;
  message?: string;
}>({ visible: false, action: null });

const [errorModal, setErrorModal] = useState<{ visible: boolean; message: string }>({
  visible: false,
  message: "",
});


  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-staff", label: "Home", icon: HomeIcon },
    { name: "staff-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
  ];

  // Fetch announcements
  useEffect(() => {
    fetchAnnouncements(currentPage);
  }, [currentPage, itemsPerPage]);

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000ms = 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/announcement?page=${page}&limit=${itemsPerPage}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.error("Fetch failed", res.status, await res.text());
        throw new Error("Failed to fetch announcements");
      }
      const data = await res.json();
      setAnnouncements(data.announcements);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setMessage("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  // Form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // Submit (create/update)
  const handleSubmitClick = (e: React.FormEvent) => {
  e.preventDefault();

  setConfirmModal({
    visible: true,
    action: "submit",
    message: "Are you sure the details are correct?",
    payload: { ...formData },
  });
};

const confirmSubmit = async () => {
  if (!token || !confirmModal.payload) return;

  setActionLoading(true);
  setLoadingMessage(editingAnnouncement ? "Updating announcement..." : "Creating announcement...");

  try {
    const method = editingAnnouncement ? "PUT" : "POST";
    const body = editingAnnouncement
      ? { id: editingAnnouncement.announcement_id, ...confirmModal.payload }
      : { ...confirmModal.payload };

    const res = await fetch("/api/staff/announcement", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await res.text());

    setMessage(editingAnnouncement ? "Announcement updated" : "Announcement created");
    setShowModal(false);
    setEditingAnnouncement(null);
    setFormData({ title: "", content: "", is_public: true });
    fetchAnnouncements(currentPage);
  } catch (error) {
    console.error("Submit error:", error);
    setErrorModal({ visible: true, message: "Failed to save announcement" });
  } finally {
    setActionLoading(false);
    setConfirmModal({ visible: false, action: null });
  }
};


  // Edit
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_public: announcement.is_public,
    });
    setShowModal(true);
  };

  // Delete
  const handleDelete = (announcement: Announcement) => {
  setConfirmModal({
    visible: true,
    action: "delete",
    message: "Are you sure you want to delete this announcement?",
    payload: announcement,
  });
};

const confirmDelete = async (announcement: Announcement) => {
  if (!token) return;

  setActionLoading(true);
  setLoadingMessage("Deleting announcement...");

  try {
    const res = await fetch("/api/staff/announcement", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: announcement.announcement_id }),
    });

    if (!res.ok) throw new Error(await res.text());

    setMessage("Announcement deleted");
    fetchAnnouncements(currentPage);
  } catch (error) {
    console.error("Delete error:", error);
    setErrorModal({ visible: true, message: "Failed to delete announcement" });
  } finally {
    setActionLoading(false);
    setConfirmModal({ visible: false, action: null });
  }
};


  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth-front/login");
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const totalPages = pagination.totalPages;

  // Filter announcements for Active / Expired
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const filteredAnnouncements = announcements.filter(a => {
    const postedDate = new Date(a.posted_at);
    return showExpired ? postedDate < fourteenDaysAgo : postedDate >= fourteenDaysAgo;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-2 md:p-4 flex gap-2 md:gap-4">

      {actionLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-out flex flex-col 
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
                  href={`/staff-front/${name}`}
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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex items-center justify-center relative rounded-xl text-black">
            {/* Mobile sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="block md:hidden absolute left-4 text-black hover:text-red-700 focus:outline-none"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <h1 className="text-large font-bold text-center w-full">
              Manage Announcement
            </h1>
          </header>

        <main className="flex-1 bg-gray-50 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm overflow-auto text-black">
          {message && (
            <p className={`text-center p-2 rounded mb-4 ${message.includes("success") ? "bg-green-100" : "bg-red-100"}`}>
              {message}
            </p>
          )}

          {/* Toggle Active / Expired + Add Button */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-black">Announcement History</h3>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowExpired(false)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-sm ${!showExpired ? "bg-red-500 text-white" : "bg-gray-300 text-black"}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowExpired(true)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-sm ${showExpired ? "bg-red-500 text-white" : "bg-gray-300 text-black"}`}
            >
              Expired
            </button>
            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setFormData({ title: "", content: "", is_public: true });
                setShowModal(true);
              }}
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Add Announcement
            </button>
          </div>
        </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20 text-gray-600">No announcements yet.</div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredAnnouncements.map(a => (
                  <div key={a.announcement_id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md text-black">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-black break-words">{a.title}</h3>
                      <p className="text-xs sm:text-sm text-black">
                        Posted on {new Date(a.posted_at).toLocaleDateString()} • {a.is_public ? "Public" : "Private"}
                      </p>
                    </div>
                    <div className="flex gap-2 self-end sm:self-start">
                      <button 
                        onClick={() => handleEdit(a)} 
                        className="text-black hover:text-gray-800 p-2 rounded transition"
                        aria-label="Edit"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(a)} 
                        className="text-black hover:text-gray-800 p-2 rounded transition"
                        aria-label="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-black break-words">{a.content}</p>
                </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="w-full mt-5 flex justify-center">
                  <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-1 sm:px-2 py-1 text-2xl sm:text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ‹
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-all ${
                              currentPage === page
                                ? "bg-red-100 text-red-700"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <div key={i} className="px-0.5 sm:px-1 text-gray-400 text-xs sm:text-sm">
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
                      className="px-1 sm:px-2 py-1 text-2xl sm:text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ›
                    </button>

                    {/* Rows Per Page Dropdown */}
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setCurrentPage(1);
                        setItemsPerPage(Number(e.target.value));
                      }}
                      className="ml-2 sm:ml-3 bg-white border border-gray-300 text-xs sm:text-sm rounded-xl px-2 sm:px-3 py-1 focus:ring-0"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

            {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md text-black mx-4">
            <h3 className="text-xl font-semibold mb-4">
              {editingAnnouncement ? "Edit Announcement" : "Add Announcement"}
            </h3>
            <form onSubmit={handleSubmitClick} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  disabled={actionLoading}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleFormChange}
                  required
                  rows={4}
                  disabled={actionLoading}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleFormChange}
                  disabled={actionLoading}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Public</label>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      {editingAnnouncement ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingAnnouncement ? "Update" : "Create"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                  className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
            {/* Confirmation Modal */}
            {confirmModal.visible && confirmModal.payload && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-full overflow-auto text-black p-6 sm:p-8 mx-2">
                  {confirmModal.action === "delete" && (
                    <>
                      <h3 className="text-xl font-semibold mb-4 text-red-700">Confirm Delete</h3>
                      <p className="mb-4">{confirmModal.message}</p>
                      <div className="mb-4 space-y-2">
                        <p><strong>Title:</strong> {confirmModal.payload.title}</p>
                        <p><strong>Content:</strong></p>
                        <div className="whitespace-pre-wrap border p-2 rounded bg-gray-50">{confirmModal.payload.content}</div>
                        <p><strong>Visibility:</strong> {confirmModal.payload.is_public ? "Public" : "Private"}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          onClick={() => setConfirmModal({ visible: false, action: null })}
                          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded w-full sm:w-auto"
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => confirmDelete(confirmModal.payload)}
                          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white w-full sm:w-auto flex items-center justify-center gap-2"
                          disabled={actionLoading}
                        >
                          {actionLoading ? <LoadingSpinner size="sm" /> : "Yes, Delete"}
                        </button>
                      </div>
                    </>
                  )}

                  {confirmModal.action === "submit" && (
                    <>
                      <h3 className="text-xl font-semibold mb-4">{editingAnnouncement ? "Confirm Update" : "Confirm Creation"}</h3>
                      <p className="mb-4">{confirmModal.message}</p>
                      <div className="mb-4 space-y-2">
                        <p><strong>Title:</strong> {confirmModal.payload.title}</p>
                        <p><strong>Content:</strong></p>
                        <div className="whitespace-pre-wrap border p-2 rounded bg-gray-50">{confirmModal.payload.content}</div>
                        <p><strong>Visibility:</strong> {confirmModal.payload.is_public ? "Public" : "Private"}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          onClick={() => setConfirmModal({ visible: false, action: null })}
                          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded w-full sm:w-auto"
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmSubmit}
                          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white w-full sm:w-auto flex items-center justify-center gap-2"
                          disabled={actionLoading}
                        >
                          {actionLoading ? <LoadingSpinner size="sm" /> : editingAnnouncement ? "Yes, Update" : "Yes, Create"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Error Modal */}
            {errorModal.visible && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-sm max-h-full overflow-auto text-black p-6 sm:p-8 mx-2">
                  <p className="mb-4 text-red-700 font-medium">{errorModal.message}</p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setErrorModal({ visible: false, message: "" })}
                      className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded w-full sm:w-auto"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
}