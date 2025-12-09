"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  ChartBarIcon,
  MegaphoneIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  posted_by: number;
  is_public: boolean;
  posted_at: string;
  expiration_date?: string;
  expiration_days?: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-red-700 border-t-transparent rounded-full animate-spin`}
    ></div>
  );
};

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
    expiration_days: 14,
  });
  const [filterType, setFilterType] = useState<"active" | "expired">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0,
  });
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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

  const features = [
    { name: "the-dash-staff", label: "Home", icon: HomeIcon },
    { name: "staff-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
  ];

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchAnnouncements = async (type: "active" | "expired" = "active", page: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/announcement?type=${type}&page=${page}&limit=${itemsPerPage}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch announcements");
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

  useEffect(() => {
    fetchAnnouncements(filterType, currentPage);
  }, [filterType, currentPage, itemsPerPage]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : 
              type === "number" ? parseInt(value) || 14 : value,
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); 
    
    return () => clearInterval(interval);
  }, []);

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
        : { ...confirmModal.payload, posted_by: 1 };

      const res = await fetch("/api/staff/announcement", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage(editingAnnouncement ? "Announcement updated successfully" : "Announcement created successfully");
      setShowModal(false);
      setEditingAnnouncement(null);
      setFormData({ title: "", content: "", is_public: true, expiration_days: 14 });
      await fetchAnnouncements(filterType, currentPage);
    } catch (error) {
      console.error("Submit error:", error);
      setErrorModal({ visible: true, message: "Failed to save announcement" });
    } finally {
      setActionLoading(false);
      setConfirmModal({ visible: false, action: null });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_public: announcement.is_public,
      expiration_days: announcement.expiration_days || 14,
    });
    setShowModal(true);
  };

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

      setMessage("Announcement deleted successfully");
      await fetchAnnouncements(filterType, currentPage);
    } catch (error) {
      console.error("Delete error:", error);
      setErrorModal({ visible: true, message: "Failed to delete announcement" });
    } finally {
      setActionLoading(false);
      setConfirmModal({ visible: false, action: null });
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const totalPages = pagination.totalPages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
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
              const isActive = name === "announcement";
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

      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button onClick={toggleSidebar} className="block md:hidden text-black hover:text-red-700 focus:outline-none">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold">Manage Announcement</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        <main className="flex-1 bg-gray-50 rounded-xl p-4 md:p-6 shadow-sm overflow-auto text-black">
          {message && (
            <p
              className={`text-center p-2 rounded mb-4 ${
                message.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h3 className="text-large md:text-large font-semibold text-black">Announcement History</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFilterType("active");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded ${filterType === "active" ? "bg-red-700 text-white" : "bg-gray-200 text-black"}`}
                >
                  Active
                </button>
                <button
                  onClick={() => {
                    setFilterType("expired");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded ${filterType === "expired" ? "bg-red-700 text-white" : "bg-gray-200 text-black"}`}
                >
                  Expired
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setFormData({ title: "", content: "", is_public: true, expiration_days: 14 });
                setShowModal(true);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition w-full sm:w-auto"
            >
              <PlusIcon className="w-5 h-5" /> Add Announcement
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              {filterType === "active"
                ? "No latest announcements available."
                : "No expired announcements found."}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.announcement_id} className="bg-white p-4 md:p-6 rounded-lg shadow-md text-black">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-black">{a.title}</h3>
                        <p className="text-sm text-black">
                          Posted on {new Date(a.posted_at).toLocaleDateString()} • {a.is_public ? "Public" : "Private"}
                          {a.expiration_date && (
                            <span> • Expires: {new Date(a.expiration_date).toLocaleDateString()} ({a.expiration_days} days)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(a)} className="text-black hover:text-gray-800 p-2 rounded transition">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(a)} className="text-black hover:text-gray-800 p-2 rounded transition">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-black">{a.content}</p>
                  </div>
                ))}
              </div>

              <div className="w-full mt-5 flex justify-center">
                {pagination.totalPages > 1 ? (
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                              currentPage === page ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) return <span key={i}>…</span>;
                      return null;
                    })}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ›
                    </button>
                  </div>
                ) : (
                  <div className="h-10"></div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-full overflow-auto text-black p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-4">{editingAnnouncement ? "Edit Announcement" : "Add Announcement"}</h2>
            <form onSubmit={handleSubmitClick} className="flex flex-col gap-4">
              <div>
                <label className="block mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Content</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={4}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleFormChange}
                />
                <label>Public Announcement</label>
              </div>
              <div>
                <label className="block mb-1">Expiration Days</label>
                <select
                  name="expiration_days"
                  value={formData.expiration_days}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                   <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                  <option value={10}>10 days</option>
                  <option value={12}>12 days</option>
                  <option value={14}>14 days (Default)</option>
                  <option value={20}>20 days</option>
                  <option value={25}>25 days</option>
                  <option value={30}>30 days</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose how long this announcement will remain active</p>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-800 w-full sm:w-auto"
                >
                  {editingAnnouncement ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.visible && confirmModal.payload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-full overflow-auto text-black p-6 sm:p-8">

            {confirmModal.action === "delete" && (
              <>
                <h3 className="text-xl font-semibold mb-4 text-red-700">Confirm Delete</h3>
                <p className="mb-4">{confirmModal.message}</p>
                <div className="mb-4 space-y-2">
                  <p><strong>Title:</strong> {confirmModal.payload.title}</p>
                  <p><strong>Content:</strong></p>
                  <div className="whitespace-pre-wrap border p-2 rounded bg-gray-50">{confirmModal.payload.content}</div>
                  <p><strong>Visibility:</strong> {confirmModal.payload.is_public ? "Public" : "Private"}</p>
                  {confirmModal.payload.expiration_date && (
                    <p><strong>Expires:</strong> {new Date(confirmModal.payload.expiration_date).toLocaleString()} ({confirmModal.payload.expiration_days} days)</p>
                  )}
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
                    onClick={() => confirmDelete(confirmModal.payload as Announcement)}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white w-full sm:w-auto flex items-center justify-center gap-2"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <LoadingSpinner size="sm" /> Deleting...
                      </>
                    ) : "Yes, Delete"}
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
                  <p><strong>Expiration:</strong> {confirmModal.payload.expiration_days} days from posting</p>
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
                    {actionLoading ? (
                      <>
                        <LoadingSpinner size="sm" /> {editingAnnouncement ? "Updating..." : "Creating..."}
                      </>
                    ) : editingAnnouncement ? "Yes, Update" : "Yes, Create"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {errorModal.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm max-h-full overflow-auto text-black p-6 sm:p-8">
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