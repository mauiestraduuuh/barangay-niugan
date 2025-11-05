"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  BellIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XCircleIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

interface CertificateRequest {
  request_id: string;
  resident_id: string;
  certificate_type: string;
  purpose?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approved_by?: string | null;
  requested_at: string;
  approved_at?: string | null;
  file_path?: string;
  resident: {
    resident_id: string;
    first_name: string;
    last_name: string;
    contact_no?: string;
    address?: string;
  };
}

export default function AdminCertificateRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("certificate-request");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "PENDING" | "APPROVED" | "REJECTED">("");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [search, statusFilter, requests]);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const fetchRequests = async () => {
    if (!token) return setMessage("Unauthorized: No token");
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/certificate-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch certificate requests");
    }
    setLoading(false);
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (search.trim() !== "") {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.resident.first_name.toLowerCase().includes(query) ||
          req.resident.last_name.toLowerCase().includes(query) ||
          req.resident.resident_id.toLowerCase().includes(query) ||
          req.request_id.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleApproveReject = async (requestId: string, approve: boolean) => {
    if (!token) return setMessage("Unauthorized");
    try {
      await axios.put(
        "/api/admin/certificate-request",
        { requestId, status: approve ? "APPROVED" : "REJECTED", remarks: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
      setMessage(approve ? "Request approved" : "Request rejected");
    } catch (err) {
      console.error(err);
      setMessage("Action failed");
    }
  };

  const openModal = (request: CertificateRequest) => {
    setSelectedRequest(request);
    setRemarks(request.purpose || "");
    setFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setRemarks("");
    setFile(null);
  };

  const handleFileSubmit = async () => {
    if (!selectedRequest) return;
    if (!token) return setMessage("Unauthorized");

    const formData = new FormData();
    formData.append("requestId", selectedRequest.request_id);
    if (file) formData.append("file", file);
    if (remarks) formData.append("remarks", remarks);

    try {
      await axios.post("/api/admin/certificate-request", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      closeModal();
      fetchRequests();
      setMessage("File attached successfully");
    } catch (err) {
      console.error(err);
      setMessage("Failed to attach file");
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4 ">
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
        const href = `/admin-front/${name}`;
        const isActive = name === "admin-profile";
        return (
          <li key={name} className="mb-2">
            <Link href={href}>
              <span
                className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                  isActive
                    ? "text-red-700 "
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

      {/* Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 rounded-xl flex justify-between items-center">
          <h1 className="text-xl font-semibold text-black">Certificate Requests</h1>
          <BellIcon className="w-6 h-6 text-black" />
        </header>

        <main className="bg-gray-50 p-6 rounded-xl shadow-sm overflow-auto">
          {message && <p className="text-center text-white bg-gray-900 p-2 rounded mb-4">{message}</p>}

          {/* Filter/Search */}
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Search by name, ID, or request ID"
              className="border p-2 rounded flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border p-2 rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center">No certificate requests found</p>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((req) => (
                <div key={req.request_id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <p className="font-bold">{req.resident.first_name} {req.resident.last_name}</p>
                    <p className="text-sm text-gray-600">{req.certificate_type}</p>
                    <p className="text-sm text-gray-500">{req.status}</p>
                    <p className="text-sm text-gray-500">{new Date(req.requested_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {req.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApproveReject(req.request_id, true)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"
                        >
                          <CheckIcon className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleApproveReject(req.request_id, false)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-1"
                        >
                          <XCircleIcon className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openModal(req)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
                    >
                      <PaperClipIcon className="w-4 h-4" /> Attach
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-lg font-bold mb-4">Attach File / Add Remarks</h2>
            <p className="mb-2 font-semibold">{selectedRequest.resident.first_name} {selectedRequest.resident.last_name}</p>
            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleFileSubmit}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                disabled={!file && !remarks.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
