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
  BellIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XCircleIcon,
  PaperClipIcon,
  Bars3Icon,
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
  resident: {
    resident_id: string;
    first_name: string;
    last_name: string;
    contact_no?: string;
    address?: string;
  };
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
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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

   const features = [
    { name: "the-dash-staff", label: "Home", icon: HomeIcon },
    { name: "staff-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
  ];

      const openConfirmModal = (request: CertificateRequest, action: "APPROVE" | "REJECT") => {
        setRequestToConfirm(request);
        setConfirmAction(action); 
        setConfirmOpen(true);
      };


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
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000ms = 5 minutes
  
  return () => clearInterval(interval);
}, []);
  const fetchRequests = async () => {
    if (!token) return setMessage("Unauthorized: No token");
    setLoading(true);
    try {
      const res = await axios.get("/api/staff/certificate-request", {
        headers: { Authorization: `Bearer ${token}` },
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

 const handleApprove = async (requestId: string) => {
  if (!token) return setMessage("Unauthorized");
  setActionLoading(true);
  setLoadingMessage("Approving request...");
  try {
    await axios.put(
      "/api/staff/certificate-request",
      { request_id: requestId, action: "APPROVE" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await fetchRequests();
    setMessage("Request approved successfully");
  } catch (err) {
    console.error(err);
    setMessage("Failed to approve request");
  }
  setActionLoading(false);
};

const handleReject = async (request: CertificateRequest) => {
  if (!token) return setMessage("Unauthorized");
  setActionLoading(true);
  setLoadingMessage("Rejecting request...");
  try {
    await axios.put(
      "/api/staff/certificate-request",
      { request_id: request.request_id, action: "REJECT", rejection_reason: remarks },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await fetchRequests();
    setMessage("Request rejected successfully");
  } catch (err) {
    console.error(err);
    setMessage("Failed to reject request");
  }
  setActionLoading(false);
};


  const openModal = (
    request: CertificateRequest,
    type: "ATTACH" | "REJECT" | "SCHEDULE" | "CLAIMED" | "VIEW"
  ) => {
    setSelectedRequest(request);
    setModalType(type);

    if (type === "REJECT") {
      setRemarks(request.rejection_reason || "");
    } else if (type === "ATTACH") {
      setRemarks(request.purpose || "");
    } else {
      setRemarks("");
    }

    setFile(null);
    if (type === "SCHEDULE") {
      setPickupDate("");
      setPickupTime("");
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setModalType(null);
    setRemarks("");
    setFile(null);
    setPickupDate("");
    setPickupTime("");
    setModalOpen(false);
  };

const handleModalSubmit = async () => {
  if (!selectedRequest || !modalType || !token) return;

  setActionLoading(true);

  try {
    if (modalType === "REJECT") {
      // Open confirm modal instead of executing API directly
      setRequestToReject(selectedRequest);
      setRejectConfirmOpen(true);
      setModalOpen(false);
      setActionLoading(false);
      return;
    } else if (modalType === "SCHEDULE") {
      if (!pickupDate || !pickupTime) {
        setMessage("Pickup date and time are required");
        setActionLoading(false);
        return;
      }

      setLoadingMessage("Scheduling pickup...");
      await axios.put(
        "/api/staff/certificate-request",
        {
          request_id: Number(selectedRequest.request_id),
          action: "SCHEDULE_PICKUP",
          pickup_date: pickupDate,
          pickup_time: pickupTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Pickup scheduled successfully");
    } else if (modalType === "ATTACH") {
      setLoadingMessage("Uploading file...");
      const formData = new FormData();
      formData.append("request_id", selectedRequest.request_id);
      if (file) formData.append("file", file);
      if (remarks) formData.append("remarks", remarks);
      await axios.post("/api/staff/certificate-request", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setMessage("File attached successfully");
    } else if (modalType === "CLAIMED") {
      setLoadingMessage("Marking as claimed...");
      await axios.put(
        "/api/staff/certificate-request",
        { request_id: Number(selectedRequest.request_id), action: "CLAIMED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Certificate marked as claimed");
    }

    closeModal();
    await fetchRequests();
  } catch (err: any) {
    console.error(err.response?.data || err);
    setMessage(err.response?.data?.error || "Action failed");
    setActionLoading(false);
  }

  setActionLoading(false);
};

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
              const isActive = name === "the-dash-staff";
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
          <h1 className="text-large font-bold">Certificate Request</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        <main className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-sm overflow-auto">
          {message && (
            <p className="text-center text-white bg-gray-900 p-2 rounded mb-4">{message}</p>
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
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
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
            {statusFilter === "PENDING"
              ? "No pending requests"
              : statusFilter === "APPROVED"
              ? "No approved requests"
              : statusFilter === "REJECTED"
              ? "No rejected requests"
              : "No registration requests found"}
          </p>
        ) : (
          <div className="overflow-x-auto">
              <table className="min-w-full border-collapse bg-white shadow-sm rounded-xl overflow-hidden text-sm sm:text-base">
                <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Resident Name</th>
                    <th className="px-3 py-2 text-left hidden sm:table-cell">Request ID</th>
                    <th className="px-3 py-2 text-left">Certificate Type</th>
                    <th className="px-3 py-2 text-left hidden sm:table-cell">Requested At</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRequests.map((req, index) => (
                    <tr
                      key={req.request_id}
                      className={`border-b hover:bg-red-50 transition ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-black">
                        {req.resident.first_name} {req.resident.last_name}
                      </td>
                      <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">
                        {req.request_id}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{req.certificate_type}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {new Date(req.requested_at).toLocaleDateString()} {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-2">
                        {req.status === "PENDING" && (
                          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs sm:text-sm font-semibold">
                            Pending
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs sm:text-sm font-semibold">
                            Approved
                          </span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs sm:text-sm font-semibold">
                            Rejected
                          </span>
                        )}
                        {req.status === "CLAIMED" && (
                          <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs sm:text-sm font-semibold">
                            Claimed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 flex flex-wrap gap-1">
                        {req.status === "PENDING" && (
                          <>
                            <button
                            onClick={() => openConfirmModal(req, "APPROVE")}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm"
                          >
                            <CheckIcon className="w-4 h-4" /> Approve
                          </button>

                            <button
                            onClick={() => openConfirmModal(req, "REJECT")}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm"
                          >
                            <XCircleIcon className="w-4 h-4" /> Reject
                          </button>

                          </>
                        )}

                        {req.status === "APPROVED" && !req.pickup_date && (
                          <button
                            onClick={() => openModal(req, "SCHEDULE")}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm"
                          >
                            Schedule Pickup
                          </button>
                        )}
                        {req.status === "APPROVED" && req.pickup_date && (
                          <button
                            onClick={() => openModal(req, "CLAIMED")}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm"
                          >
                            Mark as Claimed
                          </button>
                        )}

                        <button
                          onClick={() => openModal(req, "VIEW")}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm"
                        >
                          View
                        </button>

                        <button
                          onClick={() => openModal(req, "ATTACH")}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm"
                        >
                          <PaperClipIcon className="w-4 h-4" /> Attach
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
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
                    value={ITEMS_PER_PAGE}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setITEMS_PER_PAGE(Number(e.target.value));
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
            </div>
          )}
        </main>
      </div>

      {/* Modal */}

      {/* Confirm Modal */}
      {confirmOpen && requestToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 max-h-[90vh] flex flex-col gap-4 text-black">
            <h2 className="text-lg font-bold">
              {confirmAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
            </h2>
            <p>
              Are you sure you want to{" "}
              {confirmAction === "APPROVE" ? "approve" : "reject"} the certificate request for{" "}
              <span className="font-semibold">
                {requestToConfirm.resident.first_name} {requestToConfirm.resident.last_name}
              </span>
              ?
            </p>

            {confirmAction === "REJECT" && (
              <textarea
                className="w-full border p-2 rounded mb-2"
                placeholder="Rejection Reason"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                No
              </button>

              <button
                onClick={() => {
                  if (confirmAction === "REJECT" && !remarks.trim()) {
                    setMessage("Please input a rejection reason");
                    return;
                  }

                  if (confirmAction === "APPROVE") handleApprove(requestToConfirm!.request_id);
                  else if (confirmAction === "REJECT") handleReject(requestToConfirm!);

                  setConfirmOpen(false);
                }}
                disabled={confirmAction === "REJECT" && !remarks.trim()} // disables button if empty
                className={`px-4 py-2 rounded text-white ${
                  confirmAction === "REJECT" && !remarks.trim()
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectConfirmOpen && requestToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 max-h-[90vh] flex flex-col gap-4 text-black">
            <h2 className="text-lg font-bold">Confirm Rejection</h2>

            <p>
              Are you sure you want to reject the certificate request for{" "}
              <span className="font-semibold">
                {requestToReject.resident.first_name} {requestToReject.resident.last_name}
              </span>?
            </p>

            <div className="flex justify-end gap-2 mt-4">
             <button
              onClick={async () => {
                    setRejectConfirmOpen(false);
                    setActionLoading(true);
                    setLoadingMessage("Rejecting request...");

                    try {
                      await axios.put(
                        "/api/staff/certificate-request",
                        {
                          request_id: Number(requestToReject.request_id),
                          action: "REJECT",
                          rejection_reason: remarks,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      setMessage("Request rejected successfully");
                      await fetchRequests();
                    } catch (err: any) {
                      console.error(err);
                      setMessage("Failed to reject request");
                    }

                      setActionLoading(false);
                    }}
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
                disabled={actionLoading}
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && selectedRequest && modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
          <div className="bg-white p-6 rounded-xl w-96 max-h-[90vh] overflow-y-auto">
            {modalType === "REJECT" && <h2 className="text-lg font-bold mb-4">Reject Request</h2>}
            {modalType === "SCHEDULE" && <h2 className="text-lg font-bold mb-4">Schedule Pickup</h2>}
            {modalType === "ATTACH" && <h2 className="text-lg font-bold mb-4">Attach File / Add Remarks</h2>}
            {modalType === "CLAIMED" && <h2 className="text-lg font-bold mb-4">Mark as Claimed</h2>}
            {modalType === "VIEW" && <h2 className="text-lg font-bold mb-4">Request Details</h2>}

            {modalType === "CLAIMED" && (
              <>
                <p className="mb-2">Are you sure this certificate has been claimed?</p>
                <p className="font-semibold">
                  {selectedRequest.resident.first_name} {selectedRequest.resident.last_name}
                </p>
              </>
            )}

            {modalType === "REJECT" && (
              <textarea
                className="w-full border p-2 rounded mb-2"
                placeholder="Rejection Reason"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            )}

            {modalType === "SCHEDULE" && (
              <>
                <input
                type="date"
                className="border p-2 rounded mb-2 w-full text-black bg-white placeholder-gray-400"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />

              <input
                type="time"
                className="border p-2 rounded mb-2 w-full text-black bg-white placeholder-gray-400"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              />
              </>
            )}

            {modalType === "VIEW" && (
              <div className="space-y-2">
                <p><strong>Resident Name:</strong> {selectedRequest.resident.first_name} {selectedRequest.resident.last_name}</p>
                <p><strong>Request ID:</strong> {selectedRequest.request_id}</p>
                <p><strong>Certificate Type:</strong> {selectedRequest.certificate_type}</p>
                <p><strong>Purpose:</strong> {selectedRequest.purpose || "N/A"}</p>
                <p><strong>Status:</strong> {selectedRequest.status}</p>
                {selectedRequest.rejection_reason && (
                  <p><strong>Rejection Reason:</strong> {selectedRequest.rejection_reason}</p>
                )}
                <p><strong>Requested At:</strong> {new Date(selectedRequest.requested_at).toLocaleString()}</p>
                {selectedRequest.pickup_date && (
                  <p><strong>Pickup Date:</strong> {selectedRequest.pickup_date} {selectedRequest.pickup_time}</p>
                )}
                {selectedRequest.approved_by && (
                  <p><strong>Approved By:</strong> {selectedRequest.approved_by}</p>
                )}
              </div>
            )}

            {modalType === "ATTACH" && (
              <>
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
              </>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                disabled={actionLoading}
              >
                Close
              </button>
              {modalType !== "VIEW" && (
                <button
                  onClick={handleModalSubmit}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Processing...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}