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
  Bars3Icon,
  XMarkIcon,
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
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("certificate-request");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const features = [
    { name: "dashboard", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  useEffect(() => {
    fetchRequests();
  }, []);

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
    setModalOpen(true);
  };

  const handleFileSubmit = async () => {
    if (!selectedRequest) return;
    if (!token) return setMessage("Unauthorized");

    const formData = new FormData();
    formData.append("requestId", selectedRequest.request_id);
    if (file) formData.append("file", file);

    try {
      await axios.post("/api/admin/certificate-request", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setModalOpen(false);
      setFile(null);
      setSelectedRequest(null);
      fetchRequests();
      setMessage("File attached successfully");
    } catch (err) {
      console.error(err);
      setMessage("Failed to attach file");
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
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
        <div className="p-4 flex items-center justify-between">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <button onClick={toggleSidebar} className="block md:hidden text-black hover:text-red-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link
                  href={`/admin-front/${name}`}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name ? "text-red-700" : "text-black hover:text-red-700"
                  }`}
                  onClick={() => setActiveItem(name)}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full ${
                      activeItem === name ? "block" : "hidden"
                    }`}
                  />
                  <Icon className="w-6 h-6 mr-2 group-hover:text-red-700" />
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4">
          <button className="flex items-center gap-3 text-red-500 hover:text-red-700 transition w-full text-left">
            Log Out
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

      {/* Overlay */}
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

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-center">No certificate requests</p>
          ) : (
            <div className="grid gap-4">
              {requests.map((req) => (
                <div key={req.request_id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <p className="font-bold">{req.resident.first_name} {req.resident.last_name}</p>
                    <p className="text-sm text-gray-600">{req.certificate_type}</p>
                    <p className="text-sm text-gray-500">{req.status}</p>
                    <p className="text-sm text-gray-500">{new Date(req.requested_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
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
            <p className="mb-2">{selectedRequest.resident.first_name} {selectedRequest.resident.last_name}</p>
            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mb-4" />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleFileSubmit}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
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
