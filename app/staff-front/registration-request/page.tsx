"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  MegaphoneIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KeyIcon,
  Bars3Icon,
  CheckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface RegistrationRequest {
  request_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  contact_no?: string;
  birthdate?: string;
  role: "RESIDENT" | "STAFF";
  submitted_at: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: { user_id: number; username: string } | null;
  address?: string;
  gender?: string;
  photo_url?: string;
  is_head_of_family?: boolean;
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

// Confirmation Modal
interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ open, title = "Confirm Action", message, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 text-black">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// Error Modal
interface ErrorModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const ErrorModal = ({ open, message, onClose }: ErrorModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-black">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400">Close</button>
        </div>
      </div>
    </div>
  );
};

export default function StaffRegistrationRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("registration-request");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "" | "APPROVED" | "REJECTED">("PENDING");
  const [message, setMessage] = useState("");
  const [viewRequest, setViewRequest] = useState<RegistrationRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);


  // Pagination
  const [ITEMS_PER_PAGE, setITEMS_PER_PAGE] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Confirmation & Error Modals State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [statusFilter, requests, searchQuery]);

  // Reload every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => window.location.reload(), 300000);
    return () => clearInterval(interval);
  }, []);

 const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const fetchRequests = async () => {
    if (!token) {
      setMessage("Unauthorized: Please login");
      router.push("/auth-front/login");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/api/staff/registration-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.requests || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to fetch registration requests");
      setErrorOpen(true);
    }
    setLoading(false);
  };

  const handleApproveReject = async (requestId: number, approve: boolean) => {
    if (!token) {
      setErrorMessage("Unauthorized");
      setErrorOpen(true);
      return;
    }
    setActionLoading(true);
    setLoading(true);
    try {
      await axios.post(
        "/api/staff/registration-request",
        { request_id: requestId, approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
      setMessage(approve ? "Request approved" : "Request rejected");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Action failed");
      setErrorOpen(true);
    } finally {
      setActionLoading(false);
      setLoading(false);
    }
  };

  // Trigger confirmation modal
  const requestAction = (requestId: number, approve: boolean) => {
    setConfirmMessage(`Are you sure you want to ${approve ? "approve" : "reject"} this request?`);
    setConfirmAction(() => () => handleApproveReject(requestId, approve));
    setConfirmOpen(true);
  };

  const filterRequests = () => {
    let filtered = [...requests];
    if (statusFilter !== "") filtered = filtered.filter(r => r.status === statusFilter);
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.first_name.toLowerCase().includes(query) ||
          r.last_name.toLowerCase().includes(query) ||
          (r.email && r.email.toLowerCase().includes(query)) ||
          (r.contact_no && r.contact_no.toLowerCase().includes(query)) ||
          String(r.request_id).includes(query)
      );
    }
    setFilteredRequests(filtered);
    setCurrentPage(1);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-staff", label: "Home", icon: HomeIcon },
    { name: "staff-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
  ];

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
        <header className="bg-gray-50 shadow-sm p-4 flex items-center justify-center relative rounded-xl text-black">
            {/* Mobile sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="block md:hidden absolute left-4 text-black hover:text-red-700 focus:outline-none"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <h1 className="text-large font-bold text-left w-full">
              Registration Request
            </h1>
          </header>

        <main className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-sm overflow-auto">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <h1 className="text-medium font-bold text-gray-800 tracking-tight">Registration History</h1>
            
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
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {message && <p className="text-center text-white bg-gray-900 p-2 rounded mb-4">{message}</p>}

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
              <table className="min-w-full border-collapse bg-white shadow-sm rounded-xl overflow-hidden text-sm sm:text-base text-black">
                <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left hidden sm:table-cell">Email</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left hidden sm:table-cell">Birthdate</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRequests.map((req, index) => (
                    <tr key={req.request_id} className={`border-b hover:bg-red-50 transition ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-3 py-2 font-medium">{req.first_name} {req.last_name}</td>
                      <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">{req.email || "N/A"}</td>
                      <td className="px-3 py-2 text-gray-700">{req.role}</td>
                      <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">{req.birthdate ? new Date(req.birthdate).toLocaleDateString() : "N/A"}</td>
                      <td className="px-3 py-2">
                        {req.status === "PENDING" && <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs sm:text-sm font-semibold">Pending</span>}
                        {req.status === "APPROVED" && <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs sm:text-sm font-semibold">Approved</span>}
                        {req.status === "REJECTED" && <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs sm:text-sm font-semibold">Rejected</span>}
                      </td>
                      <td className="px-3 py-2 flex flex-wrap gap-1">
                        {req.status === "PENDING" && (
                          <>
                            <button onClick={() => requestAction(req.request_id, true)} disabled={actionLoading} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                              <CheckIcon className="w-4 h-4" /> Approve
                            </button>
                            <button
                                onClick={() => {
                                  setRejectTargetId(req.request_id);
                                  setShowRejectModal(true);
                                }}
                              disabled={actionLoading}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircleIcon className="w-4 h-4" /> Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => setViewRequest(req)} disabled={actionLoading} className="bg-gray-300 hover:bg-gray-400 text-black px-2 py-1 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="w-full mt-5 flex justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 ">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30">‹</button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return <button key={i} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${currentPage === page ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100"}`}>{page}</button>;
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) return <div key={i} className="px-1 text-gray-400">...</div>;
                    return null;
                  })}
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30">›</button>
                  <select value={ITEMS_PER_PAGE} onChange={e => { setCurrentPage(1); setITEMS_PER_PAGE(Number(e.target.value)); }} className="ml-3 bg-white border border-gray-300 text-sm rounded-xl px-3 py-1">
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {showRejectModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
                  <h2 className="text-lg font-bold text-gray-800 mb-3">Confirm Rejection</h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to reject this registration request?
                  </p>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => {
                        if (rejectTargetId !== null) {
                          handleApproveReject(rejectTargetId, false);
                        }
                        setShowRejectModal(false);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Yes, Reject
                    </button>

                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectTargetId(null);
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Request Details Modal */}
          {viewRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-0">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full sm:w-1/2 relative overflow-auto max-h-[90vh] text-black">
                <button onClick={() => setViewRequest(null)} className="absolute top-3 right-3 text-gray-700 hover:text-red-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                <p><strong>Name:</strong> {viewRequest.first_name} {viewRequest.last_name}</p>
                <p><strong>Email:</strong> {viewRequest.email || "N/A"}</p>
                <p><strong>Contact:</strong> {viewRequest.contact_no || "N/A"}</p>
                <p><strong>Role:</strong> {viewRequest.role}</p>
                <p><strong>Birthdate:</strong> {viewRequest.birthdate ? new Date(viewRequest.birthdate).toLocaleDateString() : "N/A"}</p>
                <p><strong>Address:</strong> {viewRequest.address || "N/A"}</p>
                <p><strong>Gender:</strong> {viewRequest.gender || "N/A"}</p>
                <p><strong>Head of Family:</strong> {viewRequest.is_head_of_family ? "Yes" : "No"}</p>
                {viewRequest.photo_url && <img src={viewRequest.photo_url} alt="Photo" className="mt-4 w-32 h-32 object-cover rounded" />}
              </div>
            </div>
          )}

          {/* Confirmation & Error Modals */}
          <ConfirmModal open={confirmOpen} message={confirmMessage} onConfirm={() => { confirmAction(); setConfirmOpen(false); }} onCancel={() => setConfirmOpen(false)} />
          <ErrorModal open={errorOpen} message={errorMessage} onClose={() => setErrorOpen(false)} />

        </main>
      </div>
    </div>
  );
}
