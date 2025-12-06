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

interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  posted_by: number;
  is_public: boolean;
  posted_at: string;
}

export default function StaffManageAnnouncements() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("announcement");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_public: true,
  });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Staff features - NO analytics/reports/feedback/staff accounts (Requirement E, B)
  const features = [
    { name: "the-dash-staff", label: "Home", icon: HomeIcon },
    { name: "staff-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000ms = 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    if (!token) {
      setMessage("Unauthorized: No token");
      router.push("/auth-front/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/staff/announcement", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const data: Announcement[] = await res.json();
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load announcements");
    }
    setLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage("Unauthorized: No token");
      return;
    }
    setLoading(true);
    try {
      const method = editingAnnouncement ? "PUT" : "POST";
      const body = editingAnnouncement
        ? { id: editingAnnouncement.announcement_id, ...formData }
        : formData;

      const res = await fetch("/api/staff/announcement", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save announcement");

      setMessage(
        editingAnnouncement
          ? "Announcement updated successfully"
          : "Announcement created successfully"
      );
      setShowModal(false);
      setEditingAnnouncement(null);
      setFormData({ title: "", content: "", is_public: true });
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      setMessage("Failed to save announcement");
    }
    setLoading(false);
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
    if (!token) {
      setMessage("Unauthorized: No token");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/staff/announcement", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete announcement");

      setMessage("Announcement deleted successfully");
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      setMessage("Failed to delete announcement");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-slate-50 p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"
        }`}
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
              const isActive = name === "announcement";
              return (
                <li key={name} className="mb-2">
                  <Link href={href}>
                    <span
                      className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                        isActive ? "text-red-700 font-semibold" : "text-black hover:text-red-700"
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

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Manage Announcements</h1>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          {message && (
            <p
              className={`text-center p-2 rounded mb-4 ${
                message.includes("success")
                  ? "text-green-800 bg-green-100"
                  : "text-red-800 bg-red-100"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Announcements</h2>
            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setFormData({ title: "", content: "", is_public: true });
                setShowModal(true);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <PlusIcon className="w-5 h-5" /> Add Announcement
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No announcements yet.</div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.announcement_id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Posted on {new Date(announcement.posted_at).toLocaleDateString()} •{" "}
                        {announcement.is_public ? "Public" : "Private"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded transition"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.announcement_id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded transition"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700">{announcement.content}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
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
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-red-500"
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
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleFormChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Public</label>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingAnnouncement ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded transition"
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