"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface CertificateRequest {
  request_id: number;
  certificate_type: string;
  purpose?: string;
  requested_at: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CLAIMED";
  claim_code?: string;
  rejection_reason?: string;
  pickup_date?: string;
  pickup_time?: string;
}

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
   <div className="w-16 h-16 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
  );
};

const LoadingOverlay = ({ message = "Processing..." }: { message?: string }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Skeleton Table Row
const SkeletonRow = () => (
  <tr className="animate-pulse bg-white border-b">
    <td className="p-4">
      <div className="h-4 bg-gray-200 rounded w-8"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-gray-200 rounded w-12"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
    </td>
  </tr>
);


export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CertificateRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentRejectionReason, setCurrentRejectionReason] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [search, setSearch] = useState("");
  const [activeItem, setActiveItem] = useState("certificate-request");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "" | "APPROVED" | "REJECTED" | "CLAIMED">("PENDING");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  
  // Loading States
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-resident", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Complaint", icon: ChatBubbleLeftEllipsisIcon },
  ];

  // Initial load
  useEffect(() => {
    const initializePage = async () => {
      setInitialLoading(true);
      await fetchRequests();
      // Minimum loading time for smooth UX
      await new Promise(resolve => setTimeout(resolve, 500));
      setInitialLoading(false);
    };
    
    initializePage();
  }, []);

  // Auto-refresh every 30 seconds (only when tab is active)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchRequests();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchRequests = async () => {
    if (!token) {
      setMessage("Unauthorized: No token found");
      setInitialLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get("/api/dash/certificate-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.requests);
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to fetch certificate requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterRequests();
  }, [statusFilter, requests]);

  const filterRequests = () => {
    let filtered = [...requests];
    if (statusFilter !== "") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    setFilteredRequests(filtered);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certificateType || certificateType.trim() === "") {
      setMessageType("error");
      setMessage("Please select a certificate type.");
      return;
    }

    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);
    setLoadingMessage("Submitting certificate request...");

    try {
      const payload = {
        certificate_type: certificateType.trim(),
        purpose: purpose.trim() || undefined,
      };

      await axios.post(
        "/api/dash/certificate-request",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessageType("success");
      setMessage("Certificate request submitted successfully!");
      setShowModal(false);
      setCertificateType("");
      setPurpose("");
      await fetchRequests();
    } catch (err: any) {
      console.error("Submit error:", err.response?.data || err);
      setMessageType("error");
      
      // Extract backend error message
      let errorMessage = "Failed to submit request.";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        setTimeout(() => {
          localStorage.removeItem("token");
          router.push("/auth-front/login");
        }, 2000);
      } else if (err.response?.status === 404) {
        errorMessage = "Your resident profile was not found.";
      }
      
      setMessage(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = (req: CertificateRequest) => {
    setActionLoading(true);
    setLoadingMessage("Generating PDF...");

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Barangay Certificate", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text("This certifies that the following request has been approved.", 105, 30, { align: "center" });

      doc.text(`Certificate ID: ${req.request_id}`, 20, 50);
      doc.text(`Certificate Type: ${req.certificate_type}`, 20, 60);
      doc.text(`Purpose: ${req.purpose || "N/A"}`, 20, 70);
      doc.text(`Requested On: ${new Date(req.requested_at).toLocaleDateString()}`, 20, 80);
      doc.text(`Status: ${req.status}`, 20, 90);

      if (req.claim_code && req.pickup_date && req.pickup_time) {
        doc.text(`Claim Code: ${req.claim_code}`, 20, 100);
        doc.text(`Pickup Schedule: ${new Date(req.pickup_date).toLocaleDateString()} ${req.pickup_time}`, 20, 110);
      }

      doc.text("__________________________", 140, 140);
      doc.text("Authorized Signature", 150, 145);
      doc.setFontSize(10);
      doc.text("Barangay Management System", 105, 280, { align: "center" });
      doc.save(`certificate_${req.request_id}.pdf`);
      
      setMessageType("success");
      setMessage("PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to generate PDF");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = (req: CertificateRequest) => {
    setActionLoading(true);
    setLoadingMessage("Preparing print...");

    try {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Certificate</title></head>
            <body style="font-family: Arial; padding: 40px;">
              <h2 style="text-align: center;">Barangay Certificate</h2>
              <p>This certifies that the following request has been approved:</p>
              <p><strong>Certificate ID:</strong> ${req.request_id}</p>
              <p><strong>Certificate Type:</strong> ${req.certificate_type}</p>
              <p><strong>Purpose:</strong> ${req.purpose || "N/A"}</p>
              <p><strong>Requested On:</strong> ${new Date(req.requested_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${req.status}</p>
              ${req.claim_code && req.pickup_date && req.pickup_time ? `
              <p><strong>Claim Code:</strong> ${req.claim_code}</p>
              <p><strong>Pickup Schedule:</strong> ${new Date(req.pickup_date).toLocaleDateString()} ${req.pickup_time}</p>` : ''}
              <br><br>
              <p style="text-align: right;">__________________________<br>Authorized Signature</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        setMessageType("success");
        setMessage("Print dialog opened!");
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to open print dialog");
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

// Full Page Initial Loading with subtle colors
if (initialLoading) {
  return (
    <div className="relative min-h-screen flex">
      {/* Sidebar Skeleton */}
      <div className="w-20 md:w-20 bg-gray-100 animate-pulse flex flex-col p-4 gap-4">
        <div className="h-10 w- md:h-28 md:w-28 bg-gray-200 rounded-full mx-auto" />
        <div className="flex-1 flex flex-col gap-3 mt-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-full mt-auto" />
      </div>

      {/* Main Skeleton */}
      <div className="flex-1 flex flex-col gap-4 p-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-gray-200 rounded w-36"></div>
        </div>

        {/* Table Skeleton */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg p-4 flex flex-col gap-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4"><div className="h-4 bg-gray-200 rounded w-8"></div></th>
                <th className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></th>
                <th className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></th>
                <th className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></th>
                <th className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></th>
                <th className="p-4"><div className="h-4 bg-gray-200 rounded w-12"></div></th>
                <th className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></th>
                <th className="p-4"><div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div></th>
              </tr>
            </thead>
            <tbody>
              <tr className="animate-pulse">
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div></td>
              </tr>
              <tr className="animate-pulse">
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div></td>
              </tr>
              <tr className="animate-pulse">
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Centered Loading Spinner Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm bg-white/30">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-200 text-lg mt-3">Loading Certificate Requests...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
      {/* Action Loading Overlay */}
      {actionLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-[200] max-w-md p-4 rounded-lg shadow-lg flex items-start gap-3 ${
            messageType === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {messageType === "error" && (
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
          )}
          <p
            className={`flex-1 ${
              messageType === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {message}
          </p>
          <button
            onClick={() => {
              setMessage("");
              setMessageType("");
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

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
                  href={`/dash-front/${name}`}
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
        <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col gap-4 overflow-x-auto text-xs sm:text-sm md:text-base lg:text-lg">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <h1 className="text-large font-bold">Certificate Request</h1>

          <div className="flex items-center space-x-4">
            {loading && !initialLoading && (
              <LoadingSpinner size="sm" />
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800"
            >
              <PlusIcon className="w-5 h-5" /> Request Certificate
            </button>
          </div>
        </header>

        <div className="bg-white backdrop-blur-sm p-5 rounded-xl shadow-lg flex flex-col gap-4">
          {/* Filter */}
          <div className="flex items-center justify-between">
            <h3 className="text-large font-semibold text-gray-800 mb-4">Certificate History</h3>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Filter Status:</label>

              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium font-semibold text-gray-700 shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
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

          {/* Table */}
          {loading && !initialLoading ? (
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
              <table className="w-full text-left border-collapse text-black text-[0.65rem] sm:text-xs md:text-sm lg:text-base">
                <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white uppercase">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Requested At</th>
                    <th className="p-4">Status</th>
                    {(statusFilter === "APPROVED" || statusFilter === "CLAIMED" || statusFilter === "") && <th className="p-4">Claim Code</th>}
                    {(statusFilter === "APPROVED" || statusFilter === "CLAIMED" || statusFilter === "") && <th className="p-4">Pickup Schedule</th>}
                    {(statusFilter === "APPROVED" || statusFilter === "") && <th className="p-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </tbody>
              </table>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <ClipboardDocumentIcon className="w-12 h-12 text-gray-300" />
              <p className="text-center text-gray-500">No certificate requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
              <table className="w-full text-left border-collapse text-black text-[0.65rem] sm:text-xs md:text-sm lg:text-base">
                <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white uppercase">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Requested At</th>
                    <th className="p-4">Status</th>
                    {(statusFilter === "APPROVED" || statusFilter === "CLAIMED" || statusFilter === "") && <th className="p-4">Claim Code</th>}
                    {(statusFilter === "APPROVED" || statusFilter === "CLAIMED" || statusFilter === "") && <th className="p-4">Pickup Schedule</th>}
                    {(statusFilter === "APPROVED" || statusFilter === "") && <th className="p-4 text-center">Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.request_id}
                  className="hover:bg-gray-50 transition duration-200"
                >
                  <td className="p-4">{req.request_id}</td>
                  <td className="p-4">{req.certificate_type}</td>
                  <td className="p-4">{req.purpose || "-"}</td>
                  <td className="p-4">
                    {new Date(req.requested_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-semibold">
                {req.status === "REJECTED" ? (
                  <button
                    onClick={() => {
                      setCurrentRejectionReason(
                        req.rejection_reason || "No reason provided"
                      );
                      setShowRejectionModal(true);
                    }}
                    className="text-red-600 underline"
                  >
                    {req.status}
                  </button>
                ) : (
                  <span
                    className={`${
                      req.status === "APPROVED"
                        ? "text-green-600"
                        : req.status === "PENDING"
                        ? "text-yellow-600"
                        : req.status === "CLAIMED"
                        ? "text-purple-600"
                        : "text-gray-600"
                    }`}
                  >
                    {req.status}
                  </span>
                )}
              </td>

              {(statusFilter === "APPROVED" || statusFilter === "CLAIMED" || statusFilter === "") && (
                <td className="p-4">{req.claim_code || "-"}</td>
              )}

              {(statusFilter === "APPROVED" || statusFilter === "CLAIMED" || statusFilter === "") && (
                <td className="p-4">
                  {req.pickup_date && req.pickup_time
                    ? `${new Date(req.pickup_date).toLocaleDateString()} ${req.pickup_time}`
                    : "-"}
                </td>
              )}

              {(statusFilter === "APPROVED" || statusFilter === "") && (
                <td className="p-4 text-center">
                  {req.status === "APPROVED" ? (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handlePrint(req)}
                        disabled={actionLoading}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Print
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(req)}
                        disabled={actionLoading}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        PDF
                      </button>
                    </div>
                  ) : req.status === "PENDING" || req.status === "REJECTED" || req.status === "CLAIMED" ? null : (
                    <span className="text-gray-400 italic">No actions</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

{/* Request Modal */}
{showModal && (
  <div className="fixed inset-0 bg-black text-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl w-full max-w-md p-6 relative text-black">
      <button
        onClick={() => {
          if (!actionLoading) {
            setShowModal(false);
            setCertificateType("");
            setPurpose("");
          }
        }}
        disabled={actionLoading}
        className="absolute top-4 right-4 text-black hover:text-red-700 disabled:opacity-50"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-semibold mb-4">New Certificate Request</h2>
      <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Certificate Type <span className="text-red-600">*</span>
          </label>
          <select
            value={certificateType}
            onChange={(e) => setCertificateType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-700 focus:outline-none"
            required
            disabled={actionLoading}
          >
            <option value="">Select a type</option>
            <option value="Barangay Clearance">Barangay Clearance</option>
            <option value="Indigency Certificate">Indigency Certificate</option>
            <option value="Barangay Business Clearance">Business Business Clearance</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Purpose (Optional)</label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-700 focus:outline-none"
            placeholder="Enter purpose"
            disabled={actionLoading}
          />
        </div>
        <button
          type="submit"
          disabled={actionLoading}
          className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {actionLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Submitting...</span>
            </>
          ) : (
            "Submit Request"
          )}
        </button>
      </form>
    </div>
  </div>
)}

{showRejectionModal && (
  <div className="fixed inset-0 z-[1000] bg-black bg-opacity-40 flex items-center justify-center">
    <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
      <button
        onClick={() => setShowRejectionModal(false)}
        className="absolute top-4 right-4 text-black hover:text-red-700"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-semibold mb-4 text-red-600">Request Denied</h2>
      <p className="text-gray-700">{currentRejectionReason}</p>
      <button
        onClick={() => setShowRejectionModal(false)}
        className="mt-4 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800"
      >
        Close
      </button>
    </div>
  </div>
)}

{/* Confirmation Modal */}
{showConfirmModal && (
  <div className="fixed inset-0 z-[1000] bg-black bg-opacity-40 flex items-center justify-center">
    <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Request</h2>
      <p className="text-gray-700 mb-2">Are you sure you want to submit this certificate request?</p>
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm"><strong>Type:</strong> {certificateType}</p>
        <p className="text-sm"><strong>Purpose:</strong> {purpose || "N/A"}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setShowConfirmModal(false)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmSubmit}
          className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
</div>
</div>
);
}