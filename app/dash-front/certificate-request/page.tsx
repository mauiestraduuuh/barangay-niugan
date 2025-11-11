"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import jsPDF from "jspdf";
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
  status: string;
  claim_code?: string;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [certificateType, setCertificateType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
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
    { name: "notifications", label: "Notifications", icon: BellIcon },
  ];

  useEffect(() => {
    fetchRequests();
    fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/dash/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
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
      case "DENIED":
        return "text-red-600";
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

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
{/* Sidebar */}
      <div
  className={`${
    sidebarOpen ? "w-64" : "w-16"
  } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col
  ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}
>
  <div className="p-4 flex items-center justify-between">
    <img
      src="/logo.png"
      alt="Logo"
      className="w-10 h-10 rounded-full object-cover"
    />
    <button
      onClick={toggleSidebar}
      className="block md:hidden text-black hover:text-red-700 focus:outline-none"
    >
      <XMarkIcon className="w-6 h-6" />
    </button>
  </div>

  <nav className="flex-1 mt-6">
    <ul>
      {features.map(({ name, label, icon: Icon }) => {
        const href = `/dash-front/${name}`;
        const isActive = name === "certificate-request";
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

  <div className="p-4">
    <button className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left">
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
{/* Main Section */}
<div className="flex-1 flex flex-col gap-4">
  {/* Header */}
  <div className="flex justify-between items-center bg-gray-50 rounded-xl p-6 shadow-sm">
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Certificate Requests</h1>
      <p className="text-gray-500 mt-1">View and manage your certificate requests here.</p>
    </div>
    <button
      onClick={() => setShowModal(true)}
      className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800"
    >
      <PlusIcon className="w-5 h-5" /> Request Certificate
    </button>
  </div>

  {/* Table */}
  {message && (
    <p
      className={`text-center p-2 rounded mb-4 ${
        messageType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {message}
    </p>
  )}

  <div className="overflow-x-auto bg-white rounded-xl shadow">
    <table className="w-full border-collapse">
      <thead className="bg-gray-200 text-gray-800">
        <tr>
          <th className="border-b p-4 text-left">ID</th>
          <th className="border-b p-4 text-left">Type</th>
          <th className="border-b p-4 text-left">Purpose</th>
          <th className="border-b p-4 text-left">Requested At</th>
          <th className="border-b p-4 text-left">Status</th>
          <th className="border-b p-4 text-left">Claim Code</th>
          <th className="border-b p-4 text-left">Pickup Schedule</th>
          <th className="border-b p-4 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((req) => (
          <tr key={req.request_id} className="hover:bg-gray-50">
            <td className="border-b p-4">{req.request_id}</td>
            <td className="border-b p-4">{req.certificate_type}</td>
            <td className="border-b p-4">{req.purpose || "-"}</td>
            <td className="border-b p-4">{new Date(req.requested_at).toLocaleDateString()}</td>
            <td className={`border-b p-4 font-semibold ${statusColor(req.status)}`}>{req.status}</td>
            <td className="border-b p-4">{req.claim_code || "-"}</td>
            <td className="border-b p-4">
              {req.pickup_date && req.pickup_time
                ? `${new Date(req.pickup_date).toLocaleDateString()} ${req.pickup_time}`
                : "-"}
            </td>
            <td className="border-b p-4 text-center">
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

  {/* Request Modal */}
  {showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-black-500 hover:text-red-700"
        >
          <XMarkIcon className="w-6 h-6" />
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
</div>
    </div>
  );
}