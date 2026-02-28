/* eslint-disable @typescript-eslint/no-explicit-any */
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
  KeyIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XCircleIcon,
  PaperClipIcon,
  Bars3Icon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

interface CertificateRequest {
  request_id: string;
  resident_id: string;
  certificate_type: string;
  purpose?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CLAIMED";
  approved_by?: string | null;
  requested_at: string;
  approved_at?: string | null;
  pickup_date?: string | null;
  pickup_time?: string | null;
  claim_code?: string | null;
  rejection_reason?: string | null;
  file_path?: string | null;
  resident: {
    resident_id: string;
    first_name: string;
    last_name: string;
    contact_no?: string;
    address?: string;
  };
}

const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-3", lg: "w-12 h-12 border-4" };
  return <div className={`${sizeClasses[size]} border-red-700 border-t-transparent rounded-full animate-spin`} />;
};

const LoadingOverlay = ({ message = "Processing..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl flex flex-col items-center gap-4 shadow-2xl">
      <LoadingSpinner size="lg" />
      <p className="text-gray-700 font-medium">{message}</p>
    </div>
  </div>
);

export default function AdminCertificateRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [activeItem, setActiveItem] = useState("certificate-request");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [certSuccessUrl, setCertSuccessUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"ATTACH" | "REJECT" | "SCHEDULE" | "CLAIMED" | "VIEW" | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [search, setSearch] = useState("");
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<CertificateRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "" | "APPROVED" | "REJECTED" | "CLAIMED">("PENDING");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestToConfirm, setRequestToConfirm] = useState<CertificateRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<"APPROVE" | "REJECT" | null>(null);

  // Pagination
  const [ITEMS_PER_PAGE, setITEMS_PER_PAGE] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
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
    { name: "feedback", label: "Complaint", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff-acc", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  const openConfirmModal = (request: CertificateRequest, action: "APPROVE" | "REJECT") => {
    setRequestToConfirm(request);
    setConfirmAction(action);
    setRemarks("");
    setConfirmOpen(true);
  };

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => { setMessage(""); setCertSuccessUrl(null); }, 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  useEffect(() => { fetchRequests(); }, []);
  useEffect(() => { filterRequests(); }, [search, statusFilter, requests]);

  useEffect(() => {
    const interval = setInterval(() => { window.location.reload(); }, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const fetchRequests = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return setMessage("Unauthorized: No token");
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/certificate-request", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setRequests(res.data.requests);
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
        (r) =>
          r.resident.first_name.toLowerCase().includes(query) ||
          r.resident.last_name.toLowerCase().includes(query) ||
          String(r.resident.resident_id).toLowerCase().includes(query) ||
          String(r.request_id).toLowerCase().includes(query)
      );
    }
    if (statusFilter !== "") filtered = filtered.filter((r) => r.status === statusFilter);
    setFilteredRequests(filtered);
  };

  const generateCertificate = async (requestId: string): Promise<string | null> => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return null;
    try {
      const res = await axios.post(
        "/api/admin/generate-certificate",
        { request_id: Number(requestId) },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      return res.data.certificate_url as string;
    } catch (err: any) {
      console.error("Certificate generation failed:", err.response?.data || err);
      return null;
    }
  };

  const handleApprove = async (requestId: string) => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return setMessage("Unauthorized");
    setActionLoading(true);
    setLoadingMessage("Approving request...");
    try {
      await axios.put(
        "/api/admin/certificate-request",
        { request_id: requestId, action: "APPROVE" },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );

      setLoadingMessage("Generating certificate PDF...");
      const certUrl = await generateCertificate(requestId);

      await fetchRequests();

      if (certUrl) {
        setMessageType("success");
        setCertSuccessUrl(certUrl);
        setMessage("Request approved and certificate generated!");
      } else {
        setMessageType("success");
        setMessage("Request approved. Certificate generation failed — try manually.");
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to approve request");
    }
    setActionLoading(false);
  };

  const handleReject = async (request: CertificateRequest) => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return setMessage("Unauthorized");
    setActionLoading(true);
    setLoadingMessage("Rejecting request...");
    try {
      await axios.put(
        "/api/admin/certificate-request",
        { request_id: request.request_id, action: "REJECT", rejection_reason: remarks },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      await fetchRequests();
      setMessageType("success");
      setMessage("Request rejected successfully");
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to reject request");
    }
    setActionLoading(false);
  };

  const openModal = (request: CertificateRequest, type: "ATTACH" | "REJECT" | "SCHEDULE" | "CLAIMED" | "VIEW") => {
    setSelectedRequest(request);
    setModalType(type);
    setRemarks(type === "REJECT" ? request.rejection_reason || "" : type === "ATTACH" ? request.purpose || "" : "");
    setFile(null);
    if (type === "SCHEDULE") { setPickupDate(""); setPickupTime(""); }
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequest(null); setModalType(null); setRemarks(""); setFile(null);
    setPickupDate(""); setPickupTime(""); setModalOpen(false);
  };

  const handleModalSubmit = async () => {
    if (!selectedRequest || !modalType || !token) return;
    setActionLoading(true);
    const currentToken = localStorage.getItem("token");

    try {
      if (modalType === "REJECT") {
        setRequestToReject(selectedRequest);
        setRejectConfirmOpen(true);
        setModalOpen(false);
        setActionLoading(false);
        return;
      } else if (modalType === "SCHEDULE") {
        if (!pickupDate || !pickupTime) { setMessage("Pickup date and time are required"); setActionLoading(false); return; }
        setLoadingMessage("Scheduling pickup...");
        await axios.put("/api/admin/certificate-request",
          { request_id: Number(selectedRequest.request_id), action: "SCHEDULE_PICKUP", pickup_date: pickupDate, pickup_time: pickupTime },
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );
        setMessage("Pickup scheduled successfully");
      } else if (modalType === "ATTACH") {
        setLoadingMessage("Uploading file...");
        const formData = new FormData();
        formData.append("request_id", selectedRequest.request_id);
        if (file) formData.append("file", file);
        if (remarks) formData.append("remarks", remarks);
        await axios.post("/api/admin/certificate-request", formData, {
          headers: { Authorization: `Bearer ${currentToken}`, "Content-Type": "multipart/form-data" },
        });
        setMessage("File attached successfully");
      } else if (modalType === "CLAIMED") {
        setLoadingMessage("Marking as claimed...");
        await axios.put("/api/admin/certificate-request",
          { request_id: Number(selectedRequest.request_id), action: "CLAIMED" },
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );
        setMessage("Certificate marked as claimed");
      }
      closeModal();
      await fetchRequests();
    } catch (err: any) {
      console.error(err.response?.data || err);
      setMessage(err.response?.data?.error || "Action failed");
    }
    setActionLoading(false);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
      {actionLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-[200] max-w-md p-4 rounded-lg shadow-lg flex flex-col gap-2 ${
          messageType === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}>
          <div className="flex items-start gap-3">
            <p className={`flex-1 text-sm font-medium ${messageType === "success" ? "text-green-800" : "text-red-800"}`}>
              {message}
            </p>
            <button onClick={() => { setMessage(""); setCertSuccessUrl(null); }} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          {certSuccessUrl && (
            <a href={certSuccessUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium w-fit">
              <DocumentArrowDownIcon className="w-4 h-4" /> View Certificate PDF
            </a>
          )}
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-16"} bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static" : "hidden md:flex"}`}>
        <div className="p-4 flex items-center justify-center">
          <img src="/niugan-logo.png" alt="Company Logo" className={`rounded-full object-cover transition-all duration-300 ${sidebarOpen ? "w-30 h-30" : "w-8.5 h-8.5"}`} />
          <button onClick={toggleSidebar} className="absolute top-3 right-3 text-black hover:text-red-700 focus:outline-none md:hidden">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link href={`/admin-front/${name}`} onClick={() => setActiveItem(name)}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${activeItem === name ? "text-red-700 font-semibold" : "text-black hover:text-red-700"}`}>
                  {activeItem === name && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />}
                  <Icon className={`w-6 h-6 mr-2 ${activeItem === name ? "text-red-700" : "text-gray-600 group-hover:text-red-700"}`} />
                  {sidebarOpen && <span className={activeItem === name ? "text-red-700" : "group-hover:text-red-700"}>{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>
        <div className="p-4 flex justify-center hidden md:flex">
          <button onClick={toggleSidebar} className="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center focus:outline-none transition-colors shadow-sm">
            {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5 text-black" /> : <ChevronRightIcon className="w-5 h-5 text-black" />}
          </button>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button onClick={toggleSidebar} className="block md:hidden text-black hover:text-red-700 focus:outline-none">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold">Certificate Request</h1>
          <div />
        </header>

        <main className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-sm overflow-auto">

          {/* Certificate generated banner */}
          {certSuccessUrl && (
            <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-lg p-3 mb-4 gap-3">
              <p className="text-green-800 text-sm font-medium">
                ✅ Certificate generated successfully!
              </p>
              <div className="flex gap-2">
                <a
                  href={certSuccessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" /> View Certificate
                </a>
                <button onClick={() => setCertSuccessUrl(null)} className="text-green-700 hover:text-green-900 text-xs">✕</button>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-2 mb-4 text-black">
            <input
              type="text"
              placeholder="Search by name, ID, or request ID"
              className="border p-2 rounded flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-600">Filter Status:</label>
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CLAIMED">Claimed</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-gray-700 py-10">
              {statusFilter === "PENDING" ? "No pending requests"
                : statusFilter === "APPROVED" ? "No approved requests"
                : statusFilter === "REJECTED" ? "No rejected requests"
                : statusFilter === "CLAIMED" ? "No claimed requests"
                : "No requests found"}
            </p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {paginatedRequests.map((req) => (
                  <div key={req.request_id} className="bg-white p-3 sm:p-4 rounded-lg shadow border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-semibold text-gray-900 text-sm">{req.resident.first_name} {req.resident.last_name}</p>
                        <p className="text-xs text-gray-600">{req.certificate_type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        req.status === "PENDING" ? "bg-yellow-200 text-yellow-800" :
                        req.status === "APPROVED" ? "bg-green-200 text-green-800" :
                        req.status === "REJECTED" ? "bg-red-200 text-red-800" :
                        "bg-purple-200 text-purple-800"
                      }`}>{req.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{new Date(req.requested_at).toLocaleDateString()}</p>
                    <div className="flex flex-wrap gap-2">
                      {req.status === "PENDING" && (
                        <>
                          <button onClick={() => openConfirmModal(req, "APPROVE")} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-1 text-xs">
                            <CheckIcon className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => openConfirmModal(req, "REJECT")} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded flex items-center gap-1 text-xs">
                            <XCircleIcon className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                      {req.status === "APPROVED" && !req.pickup_date && (
                        <button onClick={() => openModal(req, "SCHEDULE")} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-xs">
                          Schedule Pickup
                        </button>
                      )}
                      {req.status === "APPROVED" && req.pickup_date && (
                        <button onClick={() => openModal(req, "CLAIMED")} className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-xs">
                          Mark as Claimed
                        </button>
                      )}
                      {req.file_path && (
                        <a href={req.file_path} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                          <DocumentArrowDownIcon className="w-4 h-4" /> Cert
                        </a>
                      )}
                      <button onClick={() => openModal(req, "VIEW")} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-xs">View</button>
                      <button onClick={() => openModal(req, "ATTACH")} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1 text-xs">
                        <PaperClipIcon className="w-4 h-4" /> Attach
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full border-collapse bg-white shadow-sm rounded-xl overflow-hidden text-sm">
                  <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Resident Name</th>
                      <th className="px-3 py-2 text-left">Request ID</th>
                      <th className="px-3 py-2 text-left">Certificate Type</th>
                      <th className="px-3 py-2 text-left">Requested At</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.map((req, index) => (
                      <tr key={req.request_id} className={`border-b hover:bg-red-50 transition ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-3 py-2 font-medium text-black">{req.resident.first_name} {req.resident.last_name}</td>
                        <td className="px-3 py-2 text-gray-700">{req.request_id}</td>
                        <td className="px-3 py-2 text-gray-700">{req.certificate_type}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {new Date(req.requested_at).toLocaleDateString()}{" "}
                          {new Date(req.requested_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            req.status === "PENDING" ? "bg-yellow-200 text-yellow-800" :
                            req.status === "APPROVED" ? "bg-green-200 text-green-800" :
                            req.status === "REJECTED" ? "bg-red-200 text-red-800" :
                            "bg-purple-200 text-purple-800"
                          }`}>{req.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {req.status === "PENDING" && (
                              <>
                                <button onClick={() => openConfirmModal(req, "APPROVE")} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs">
                                  <CheckIcon className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={() => openConfirmModal(req, "REJECT")} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs">
                                  <XCircleIcon className="w-4 h-4" /> Reject
                                </button>
                              </>
                            )}
                            {req.status === "APPROVED" && !req.pickup_date && (
                              <button onClick={() => openModal(req, "SCHEDULE")} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                                Schedule Pickup
                              </button>
                            )}
                            {req.status === "APPROVED" && req.pickup_date && (
                              <button onClick={() => openModal(req, "CLAIMED")} className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs">
                                Mark as Claimed
                              </button>
                            )}
                            {req.file_path && (
                              <a href={req.file_path} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-medium">
                                <DocumentArrowDownIcon className="w-4 h-4" /> Cert
                              </a>
                            )}
                            <button onClick={() => openModal(req, "VIEW")} className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs">View</button>
                            <button onClick={() => openModal(req, "ATTACH")} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs">
                              <PaperClipIcon className="w-4 h-4" /> Attach
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="w-full mt-5 flex flex-col sm:flex-row justify-center items-center gap-3">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="px-2 py-1 text-2xl sm:text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30">‹</button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button key={i} onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-all ${currentPage === page ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}>
                          {page}
                        </button>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <div key={i} className="px-1 text-gray-400 text-xs">...</div>;
                    }
                    return null;
                  })}
                  <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="px-2 py-1 text-2xl sm:text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30">›</button>
                </div>
                <select value={ITEMS_PER_PAGE} onChange={(e) => { setCurrentPage(1); setITEMS_PER_PAGE(Number(e.target.value)); }}
                  className="bg-white border border-gray-300 text-xs sm:text-sm rounded-xl px-3 py-1.5 focus:ring-0 w-32">
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Confirm Approve/Reject Modal ── */}
      {confirmOpen && requestToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-3">{confirmAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}</h2>
            <p className="text-sm mb-3">
              Are you sure you want to {confirmAction === "APPROVE" ? "approve" : "reject"} the certificate request for{" "}
              <span className="font-semibold">{requestToConfirm.resident.first_name} {requestToConfirm.resident.last_name}</span>?
            </p>
            {confirmAction === "APPROVE" && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 mb-3">
                📄 A certificate PDF will be automatically generated upon approval.
              </p>
            )}
            {confirmAction === "REJECT" && (
              <textarea
                className="w-full border p-2 rounded mb-2 text-sm"
                placeholder="Rejection Reason"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm">No</button>
              <button
                onClick={() => {
                  if (confirmAction === "REJECT" && !remarks.trim()) { setMessage("Please input a rejection reason"); return; }
                  if (confirmAction === "APPROVE") handleApprove(requestToConfirm.request_id);
                  else if (confirmAction === "REJECT") handleReject(requestToConfirm);
                  setConfirmOpen(false);
                }}
                disabled={confirmAction === "REJECT" && !remarks.trim()}
                className={`px-4 py-2 rounded text-white text-sm ${confirmAction === "REJECT" && !remarks.trim() ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Confirm Modal ── */}
      {rejectConfirmOpen && requestToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-md mx-4">
            <h2 className="text-lg font-bold mb-2">Confirm Rejection</h2>
            <p className="text-sm">Are you sure you want to reject the request for{" "}
              <span className="font-semibold">{requestToReject.resident.first_name} {requestToReject.resident.last_name}</span>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
              <button onClick={() => setRejectConfirmOpen(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm">Cancel</button>
              <button
                onClick={async () => {
                  setRejectConfirmOpen(false);
                  setActionLoading(true);
                  setLoadingMessage("Rejecting request...");
                  const currentToken = localStorage.getItem("token");
                  try {
                    await axios.put("/api/admin/certificate-request",
                      { request_id: Number(requestToReject.request_id), action: "REJECT", rejection_reason: remarks },
                      { headers: { Authorization: `Bearer ${currentToken}` } }
                    );
                    setMessageType("success");
                    setMessage("Request rejected successfully");
                    await fetchRequests();
                  } catch (err: any) {
                    setMessageType("error");
                    setMessage("Failed to reject request");
                  }
                  setActionLoading(false);
                }}
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Modal ── */}
      {modalOpen && selectedRequest && modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
          <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {modalType === "REJECT" ? "Reject Request" :
               modalType === "SCHEDULE" ? "Schedule Pickup" :
               modalType === "ATTACH" ? "Attach File" :
               modalType === "CLAIMED" ? "Mark as Claimed" : "Request Details"}
            </h2>

            {modalType === "CLAIMED" && (
              <p className="mb-2">Are you sure this certificate has been claimed by <span className="font-semibold">{selectedRequest.resident.first_name} {selectedRequest.resident.last_name}</span>?</p>
            )}
            {modalType === "REJECT" && (
              <textarea className="w-full border p-2 rounded mb-2 text-sm" placeholder="Rejection Reason" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            )}
            {modalType === "SCHEDULE" && (
              <>
                <input type="date" className="border p-2 rounded mb-2 w-full text-black bg-white" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                <input type="time" className="border p-2 rounded mb-2 w-full text-black bg-white" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
              </>
            )}
            {modalType === "VIEW" && (
              <div className="space-y-2 text-sm">
                <p><strong>Resident:</strong> {selectedRequest.resident.first_name} {selectedRequest.resident.last_name}</p>
                <p><strong>Request ID:</strong> {selectedRequest.request_id}</p>
                <p><strong>Certificate Type:</strong> {selectedRequest.certificate_type}</p>
                <p><strong>Purpose:</strong> {selectedRequest.purpose || "N/A"}</p>
                <p><strong>Status:</strong> {selectedRequest.status}</p>
                {selectedRequest.rejection_reason && <p><strong>Rejection Reason:</strong> {selectedRequest.rejection_reason}</p>}
                <p><strong>Requested At:</strong> {new Date(selectedRequest.requested_at).toLocaleString()}</p>
                {selectedRequest.pickup_date && <p><strong>Pickup:</strong> {selectedRequest.pickup_date} {selectedRequest.pickup_time}</p>}
                {selectedRequest.claim_code && <p><strong>Claim Code:</strong> <span className="font-mono bg-gray-100 px-1 rounded">{selectedRequest.claim_code}</span></p>}
                {selectedRequest.approved_by && <p><strong>Approved By:</strong> {selectedRequest.approved_by}</p>}
                {selectedRequest.file_path && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-emerald-800 font-semibold text-sm mb-2">📄 Certificate PDF</p>
                    <a href={selectedRequest.file_path} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                      <DocumentArrowDownIcon className="w-4 h-4" /> Open Certificate
                    </a>
                  </div>
                )}
                {/* ── Generate Certificate Now button (for approved requests missing a PDF) ── */}
                {selectedRequest.status === "APPROVED" && !selectedRequest.file_path && (
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        setLoadingMessage("Generating certificate...");
                        const certUrl = await generateCertificate(selectedRequest.request_id);
                        setActionLoading(false);
                        if (certUrl) {
                          setMessageType("success");
                          setCertSuccessUrl(certUrl);
                          setMessage("Certificate generated!");
                          await fetchRequests();
                          closeModal();
                        } else {
                          setMessageType("error");
                          setMessage("Failed to generate certificate");
                        }
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-medium"
                    >
                      Generate Certificate Now
                    </button>
                  </div>
                )}
              </div>
            )}
            {modalType === "ATTACH" && (
              <>
                <textarea className="w-full border p-2 rounded mb-2 text-sm" placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mb-4" />
              </>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm" disabled={actionLoading}>Close</button>
              {modalType !== "VIEW" && (
                <button onClick={handleModalSubmit} disabled={actionLoading}
                  className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50 text-sm">
                  {actionLoading ? <><LoadingSpinner size="sm" /> Processing...</> : "Submit"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}