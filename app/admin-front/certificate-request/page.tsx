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

export default function AdminCertificateRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState("certificate-request");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"ATTACH" | "REJECT" | "SCHEDULE" | "CLAIMED" | "VIEW" |  null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "" | "APPROVED" | "REJECTED"| "CLAIMED">("PENDING");
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

  // Auto-clear messages
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

  const fetchRequests = async () => {
    if (!token) return setMessage("Unauthorized: No token");
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/certificate-request", {
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
          r.resident.resident_id.toLowerCase().includes(query) ||
          r.request_id.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== "") filtered = filtered.filter((r) => r.status === statusFilter);
    setFilteredRequests(filtered);
  };

  // Approve request
  const handleApprove = async (requestId: string) => {
    if (!token) return setMessage("Unauthorized");
    try {
      await axios.put(
        "/api/admin/certificate-request",
        { request_id: requestId, action: "APPROVE" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
      setMessage("Request approved successfully");
    } catch (err) {
      console.error(err);
      setMessage("Failed to approve request");
    }
  };

  // Open modal for REJECT, ATTACH, SCHEDULE, Claim
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

  try {
    if (modalType === "REJECT") {
      await axios.put(
        "/api/admin/certificate-request",
        { request_id: Number(selectedRequest.request_id), action: "REJECT", rejection_reason: remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Request rejected successfully");
    } else if (modalType === "SCHEDULE") {
  if (!pickupDate || !pickupTime) {
    setMessage("Pickup date and time are required");
    return;
  }

  try {
    const res = await axios.put(
      "/api/admin/certificate-request",
      {
        request_id: Number(selectedRequest.request_id),
        action: "SCHEDULE_PICKUP",
        pickup_date: pickupDate, 
        pickup_time: pickupTime,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setMessage("Pickup scheduled successfully");
  } catch (err: any) {
    console.error("Backend error:", err.response?.data || err);
    setMessage(err.response?.data?.error || "Failed to update request");
  }
} else if (modalType === "ATTACH") {
      const formData = new FormData();
      formData.append("requestId", selectedRequest.request_id);
      if (file) formData.append("file", file);
      if (remarks) formData.append("remarks", remarks);
      await axios.post("/api/admin/certificate-request", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setMessage("File attached successfully");
    } else if (modalType === "CLAIMED") {
      await axios.put(
        "/api/admin/certificate-request",
        { request_id: Number(selectedRequest.request_id), action: "CLAIMED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Certificate marked as claimed");
    }
    closeModal();
    fetchRequests();
  } catch (err: any) {
    console.error(err.response?.data || err);
    setMessage(err.response?.data?.error || "Action failed");
  }
};

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold ">Certificate Request</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        <main className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-sm overflow-auto">
  {message && (
    <p className="text-center text-white bg-gray-900 p-2 rounded mb-4">{message}</p>
  )}

  {/* Filter/Search */}
  <div className="flex flex-col md:flex-row gap-2 mb-4 text-black">
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
      <option value="REJECTED">Claimed</option>
    </select>
  </div>

  {loading ? (
    <p className="text-center">Loading...</p>
  ) : filteredRequests.length === 0 ? (
    <p className="text-center">No certificate requests found</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-white shadow-sm rounded-xl overflow-hidden text-sm sm:text-base">
       <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white ">
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
          {filteredRequests.map((req, index) => (
            <tr
              key={req.request_id}
              className={`border-b hover:bg-red-50 transition ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <td className="px-3 py-2 font-medium">
                {req.resident.first_name} {req.resident.last_name}
              </td>
              <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">
                {req.request_id}
              </td>
              <td className="px-3 py-2 text-gray-700">{req.certificate_type}</td>
              <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">
                {new Date(req.requested_at).toLocaleString()}
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
                      onClick={() => handleApprove(req.request_id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm"
                    >
                      <CheckIcon className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => openModal(req, "REJECT")}
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
                    onClick={() => openModal(req,"CLAIMED")}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm"
                  >
                    Mark as Claimed
                  </button>
                )}
                
                <button onClick={() => openModal(req, "VIEW")}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs sm:text-sm">
                  View</button>

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
    </div>
  )}
</main>
      </div>

                {/* Modal */}
          {modalOpen && selectedRequest && modalType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
              <div className="bg-white p-6 rounded-xl w-96">

                {/* Titles */}
                {modalType === "REJECT" && <h2 className="text-lg font-bold mb-4">Reject Request</h2>}
                {modalType === "SCHEDULE" && <h2 className="text-lg font-bold mb-4">Schedule Pickup</h2>}
                {modalType === "ATTACH" && <h2 className="text-lg font-bold mb-4">Attach File / Add Remarks</h2>}
                {modalType === "CLAIMED" && <h2 className="text-lg font-bold mb-4">Mark as Claimed</h2>}

                {/* CLAIMED confirmation */}
                {modalType === "CLAIMED" && (
                  <>
                    <p className="mb-2">Are you sure this certificate has been claimed?</p>
                    <p className="font-semibold">
                      {selectedRequest.resident.first_name} {selectedRequest.resident.last_name}
                    </p>
                  </>
                )}

                {/* REJECT */}
                {modalType === "REJECT" && (
                  <textarea
                    className="w-full border p-2 rounded mb-2"
                    placeholder="Rejection Reason"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                )}

                {/* SCHEDULE */}
                {modalType === "SCHEDULE" && (
                  <>
                    <input
                      type="date"
                      className="border p-2 rounded mb-2 w-full"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                    />
                    <input
                      type="time"
                      className="border p-2 rounded mb-2 w-full"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                    />
                  </>
                )}

                 {/* VIEW */}
                {modalType === "VIEW" && selectedRequest && (
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold mb-2">Request Details</h2>
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

                {/* ATTACH */}
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

                {/* Buttons SA Modal */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  >
                    Close
                  </button>
                  {modalType !== "VIEW" && (
                    <button
                      onClick={handleModalSubmit}
                      className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
