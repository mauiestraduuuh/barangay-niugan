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

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Complaint", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff-acc", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
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
      const res = await fetch(`/api/admin/announcement?type=${type}&page=${page}&limit=${itemsPerPage}`, {
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

  useEffect(() => {
    fetchAnnouncements(filterType, currentPage);
  }, [filterType, currentPage, itemsPerPage]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setMessage("Unauthorized: No token");
    
    setActionLoading(true);
    setLoadingMessage(editingAnnouncement ? "Updating announcement..." : "Creating announcement...");

    try {
      const method = editingAnnouncement ? "PUT" : "POST";
      const body = editingAnnouncement
        ? { id: editingAnnouncement.announcement_id, ...formData }
        : { ...formData, posted_by: 1 };

      const res = await fetch("/api/admin/announcement", {
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
      setFormData({ title: "", content: "", is_public: true });
      await fetchAnnouncements(filterType, currentPage);
    } catch (error) {
      console.error("Submit error:", error);
      setMessage("Failed to save announcement");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_public: announcement.is_public,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    if (!token) return setMessage("Unauthorized: No token");

    setActionLoading(true);
    setLoadingMessage("Deleting announcement...");
    
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage("Announcement deleted successfully");
      await fetchAnnouncements(filterType, currentPage);
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Failed to delete announcement");
    } finally {
      setActionLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-slate-50 p-4 flex gap-4">
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
        <div
          className="fixed inset-0 bg-white/80 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold">Manage Announcement</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        <main className="flex-1 bg-gray-50 rounded-xl p-4 md:p-6 shadow-sm overflow-auto text-black">
          {message && (
            <p className={`text-center p-2 rounded mb-4 ${message.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
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
                setFormData({ title: "", content: "", is_public: true });
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
            <div className="text-center py-20 text-gray-600">No announcements yet.</div>
          ) : (
            <>
              <div className="space-y-4">
                {announcements.map(a => (
                  <div key={a.announcement_id} className="bg-white p-4 md:p-6 rounded-lg shadow-md text-black">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-black">{a.title}</h3>
                        <p className="text-sm text-black">
                          Posted on {new Date(a.posted_at).toLocaleDateString()} • {a.is_public ? "Public" : "Private"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(a)}
                          className="text-black hover:text-gray-800 p-2 rounded transition"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.announcement_id)}
                          className="text-black hover:text-gray-800 p-2 rounded transition"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-black">{a.content}</p>
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="w-full mt-5 flex justify-center">
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

                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <div key={i} className="px-1 text-gray-400">
                            ...
                          </div>
                        );
                      }

                      return null;
                    })}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ›
                    </button>

                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setCurrentPage(1);
                        setItemsPerPage(Number(e.target.value));
                      }}
                      className="ml-3 bg-white border border-gray-300 text-sm rounded-xl px-3 py-1 focus:ring-0"
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-black">
            <h3 className="text-xl font-semibold mb-4">
              {editingAnnouncement ? "Edit Announcement" : "Add Announcement"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
    </div>
  );
}