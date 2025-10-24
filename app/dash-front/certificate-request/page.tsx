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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: 'the-dash-resident', label: 'Home', icon: HomeIcon },
    { name: 'resident', label: 'Manage Profile', icon: UserIcon },
    { name: 'digital-id', label: 'Digital ID', icon: CreditCardIcon },
    { name: 'certificate-request', label: 'Certificates', icon: ClipboardDocumentIcon },
    { name: 'feedback', label: 'Feedback / Complain', icon: ChatBubbleLeftEllipsisIcon },
    { name: 'notifications', label: 'Notifications', icon: BellIcon },
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
      }, 5000); // Clear message after 5 seconds
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

  const handleDownloadPDF = (req: CertificateRequest) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Barangay Certificate", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(
      "This certifies that the following request has been approved.",
      105,
      30,
      { align: "center" }
    );
    doc.text(`Certificate ID: ${req.request_id}`, 20, 50);
    doc.text(`Certificate Type: ${req.certificate_type}`, 20, 60);
    doc.text(`Purpose: ${req.purpose || "N/A"}`, 20, 70);
    doc.text(
      `Requested On: ${new Date(req.requested_at).toLocaleDateString()}`,
      20,
      80
    );
    doc.text(`Status: ${req.status}`, 20, 90);
    doc.text("__________________________", 140, 120);
    doc.text("Authorized Signature", 150, 125);
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
            <p><strong>Requested On:</strong> ${new Date(
              req.requested_at
            ).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${req.status}</p>
            <br><br>
            <p style="text-align: right;">__________________________<br>Authorized Signature</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
  useEffect(() => {
    fetchNotifications();
  }, []);

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
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">
            Certificate Requests
          </h1>
          <div className="flex items-center space-x-4">
            <NotificationDropdown notifications={notifications} />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              My Certificate Requests
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800"
            >
              <PlusIcon className="w-5 h-5" /> Request Certificate
            </button>
          </div>

          {message && (
            <p className={`text-center p-2 rounded mb-4 ${messageType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
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
                  <th className="border-b p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-gray-50">
                    <td className="border-b p-4">{req.request_id}</td>
                    <td className="border-b p-4">{req.certificate_type}</td>
                    <td className="border-b p-4">{req.purpose || "-"}</td>
                    <td className="border-b p-4">
                      {new Date(req.requested_at).toLocaleDateString()}
                    </td>
                    <td
                      className={`border-b p-4 font-semibold ${statusColor(
                        req.status
                      )}`}
                    >
                      {req.status}
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
                        <span className="text-gray-400 italic">
                          No actions
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Request a Certificate
            </h2>

            <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col">
                <span className="text-sm text-gray-600 mb-1">
                  Certificate Type
                </span>
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-700"
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Type</option>
                  <option value="Barangay Clearance">Barangay Clearance</option>
                  <option value="Certificate of Residency">
                    Certificate of Residency
                  </option>
                  <option value="Indigency Certificate">
                    Indigency Certificate
                  </option>
                </select>
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-600 mb-1">Purpose</span>
                <textarea
                  className="border rounded-lg p-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-700"
                  placeholder="State your purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}