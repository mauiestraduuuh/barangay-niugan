"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";
import NotificationDropdown from "../../components/NotificationDropdown";
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

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CertificateRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentRejectionReason, setCurrentRejectionReason] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [search, setSearch] = useState("");
  const [activeItem, setActiveItem] = useState("certificate-request");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "" | "APPROVED" | "REJECTED"| "CLAIMED">("PENDING");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-resident", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback / Complain", icon: ChatBubbleLeftEllipsisIcon },
  ];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!token) return setMessage("Unauthorized: No token found");
    try {
      const res = await axios.get("/api/dash/certificate-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.requests);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch certificate requests");
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
    if (!certificateType) return setMessage("Please select a certificate type.");

    try {
      await axios.post(
        "/api/dash/certificate-request",
        { certificate_type: certificateType, purpose },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessageType("success");
      setMessage("Certificate request submitted successfully!");
      setShowModal(false);
      setCertificateType("");
      setPurpose("");
      fetchRequests();
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Failed to submit request.");
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    }
  };

  const statusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "text-green-600";
      case "PENDING":
        return "text-yellow-600";
      case "REJECTED":
        return "text-red-600";
      case "CLAIMED":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const handleDownloadPDF = (req: CertificateRequest) => {
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
  };

  const handlePrint = (req: CertificateRequest) => {
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
    }
  };
    const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  return (
    <div className= "min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4 ">
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
        <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

{/* MAIN */}
<div className="flex-1 flex flex-col gap-4 overflow-x-auto text-xs sm:text-sm md:text-base lg:text-lg">

  {/* Header */}
  <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
    <button
      onClick={toggleSidebar}
      className="block md:hidden text-black hover:text-red-700 focus:outline-none"
    >
      <Bars3Icon className="w-6 h-6" />
    </button>

    <h1 className="text-large font-bold">Certificate Request</h1>

    <div className="flex items-center space-x-4"></div>
        {/* Request Certificate Button */}
    <div className="flex justify-end">
      <button
        onClick={() => setShowModal(true)}
        className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800"
      >
        <PlusIcon className="w-5 h-5" /> Request Certificate
      </button>
    </div>
  </header>

  {/* MAIN CONTENT CONTAINER */}
  <div className="bg-white backdrop-blur-sm p-5 rounded-xl shadow-lg flex flex-col gap-4">


    {/* Filter */}
<div className="flex items-center justify-between">
  <h3 className="text-large font-semibold text-gray-800 mb-4">Certificate History</h3>
  
  <div className="flex items-center gap-3">
    <label className="text-sm font-semibold text-gray-600">Filter Status:</label>
    
    <div className="relative">
      <select
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
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
    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
      <table className="w-full text-left border-collapse text-black text-[0.65rem] sm:text-xs md:text-sm lg:text-base">
        <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white uppercase">
          <tr>
            <th className="p-4">ID</th>
            <th className="p-4">Type</th>
            <th className="p-4">Purpose</th>
            <th className="p-4">Requested At</th>
            <th className="p-4">Status</th>
            <th className="p-4">Claim Code</th>
            <th className="p-4">Pickup Schedule</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredRequests.map((req) => (
            <tr
              key={req.request_id}
              className="hover:bg-gray-50 transition duration-200"
            >
              <td className="p-4">{req.request_id}</td>
              <td className="p-4">{req.certificate_type}</td>
              <td className="p-4">{req.purpose || "-"}</td>
              <td className="p-4">
                {new Date(req.requested_at).toLocaleDateString()}
              </td>

              {/* Status */}
              <td className="p-4 font-semibold">
                {req.status === "REJECTED" ? (
                  <button
                    onClick={() => {
                      setCurrentRejectionReason(
                        req.rejection_reason || "No reason provided"
                      );
                      setShowRejectionModal(true);
                    }}
                    className="text-red-600 hover:underline"
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

              <td className="p-4">{req.claim_code || "-"}</td>

              <td className="p-4">
                {req.pickup_date && req.pickup_time
                  ? `${new Date(req.pickup_date).toLocaleDateString()} ${req.pickup_time}`
                  : "-"}
              </td>

              <td className="p-4 text-center">
                {req.status === "APPROVED" ? (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handlePrint(req)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Print
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(req)}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                    >
                      PDF
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No actions</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

  </div>

  {/* Request Modal */}
  {showModal && (
    <div className="fixed inset-0 bg-black text-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative text-black">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-black-500 hover:text-red-700"
        >
          <XMarkIcon className="w-6 h-6 text-black" />
        </button>
        <h2 className="text-xl font-semibold mb-4">New Certificate Request</h2>
        <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-black-700 mb-1">Certificate Type</label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              className="w-full border-black-300 rounded-lg p-2"
              required
            >
              <option value="">Select a type</option>
              <option value="Barangay Clearance">Barangay Clearance</option>
              <option value="Indigency Certificate">Indigency Certificate</option>
              <option value="Business Permit">Business Permit</option>
              {/* Add more types as needed */}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Purpose</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full border-black-300 rounded-lg p-2"
              placeholder="Enter purpose"
            />
          </div>
          <button
            type="submit"
            className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800"
          >
            Submit Request
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
      <p>{currentRejectionReason}</p>
      <button
        onClick={() => setShowRejectionModal(false)}
        className="mt-4 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800"
      >
        Close
      </button>
    </div>
  </div>
)}
</div>


    </div>
  );
}