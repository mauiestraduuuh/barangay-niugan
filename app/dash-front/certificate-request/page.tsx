"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  BellIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
}

interface Announcement {
  announcement_id: number;
  title: string;
  content?: string;
  posted_at: string;
}

interface CertificateRequest {
  request_id: number;
  certificate_type: string;
  purpose?: string | null;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
  requested_at: string;
  approved_at?: string | null;
}

interface FormField {
  name: string;
  placeholder: string;
  required: boolean;
}

interface CertificateForm {
  type: string;
  requirements: string[];
  fields: FormField[];
}

// Define fields according to the official references
const certificateForms: CertificateForm[] = [
  {
    type: "Barangay Clearance",
    requirements: [
      "Valid ID",
      "Proof of residence",
      "Completed application form",
    ],
    fields: [
      { name: "full_name", placeholder: "Full Name", required: true },
      { name: "address", placeholder: "Address", required: true },
      { name: "purpose", placeholder: "Purpose of Clearance", required: true },
      { name: "birthdate", placeholder: "Birthdate (YYYY-MM-DD)", required: true },
      { name: "contact_number", placeholder: "Contact Number", required: true },
    ],
  },
  {
    type: "Indigency",
    requirements: [
      "Barangay ID",
      "Affidavit of indigency",
      "Proof of income or lack thereof",
    ],
    fields: [
      { name: "full_name", placeholder: "Full Name", required: true },
      { name: "address", placeholder: "Address", required: true },
      { name: "purpose", placeholder: "Purpose", required: true },
      { name: "income_status", placeholder: "Income Status / Remarks", required: true },
      { name: "contact_number", placeholder: "Contact Number", required: true },
    ],
  },
  {
    type: "First Time Job Seekers",
    requirements: [
      "School ID / Certificate",
      "Resume (optional)",
      "Completed application form",
    ],
    fields: [
      { name: "full_name", placeholder: "Full Name", required: true },
      { name: "school", placeholder: "School / Institution", required: true },
      { name: "position", placeholder: "Position Applying For", required: true },
      { name: "contact_number", placeholder: "Contact Number", required: true },
    ],
  },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('certificates');
  const [resident, setResident] = useState<Resident | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchResident();
    fetchAnnouncements();
    fetchRequests();
  }, []);

  const fetchResident = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/dash/the-dash", {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      if (res.ok) setResident(data.resident);
      else console.error(data.message);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/dash/announcement");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const data: Announcement[] = await res.json();
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRequests = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/dash/certificate-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.requests);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch requests");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const submitRequest = async () => {
    if (!selectedType) return;
    const form = certificateForms.find((f) => f.type === selectedType);
    if (!form) return;

    for (const field of form.fields) {
      if (field.required && !formData[field.name]) {
        setMessage(`Field "${field.placeholder}" is required`);
        return;
      }
    }

    setLoading(true);
    try {
      await axios.post(
        "/api/dash/certificate-request",
        { certificate_type: selectedType, form_data: formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Request for ${selectedType} submitted!`);
      setFormData({});
      setSelectedType("");
      fetchRequests();
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit request");
    }
    setLoading(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-200 text-yellow-800";
      case "PROCESSING": return "bg-blue-200 text-blue-800";
      case "APPROVED": return "bg-green-200 text-green-800";
      case "REJECTED": return "bg-red-200 text-red-800";
      default: return "";
    }
  };

  const features = [
    { name: 'home', label: 'Home', icon: HomeIcon },
    { name: 'manage-profile', label: 'Manage Profile', icon: UserIcon },
    { name: 'digital-id', label: 'Digital ID', icon: CreditCardIcon },
    { name: 'certificates', label: 'Certificates', icon: ClipboardDocumentIcon },
    { name: 'feedback', label: 'Feedback / Complain', icon: ChatBubbleLeftEllipsisIcon },
    { name: 'notifications', label: 'Notifications', icon: BellIcon },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'block' : 'hidden'
        } md:block md:relative md:translate-x-0 ${
          sidebarOpen ? 'fixed inset-y-0 left-0 z-50 md:static md:translate-x-0' : ''
        }`}
      >
        {/* Top Section */}
        <div className="p-4 flex items-center justify-between">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
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
                  href={`/dash-front/${name.replace('-', '-')}`}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name
                      ? 'text-red-700'
                      : 'text-black hover:text-red-700'
                  }`}
                  onClick={() => setActiveItem(name)}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full ${
                      activeItem === name ? 'block' : 'hidden'
                    }`}
                  />
                  <Icon className="w-6 h-6 mr-2 group-hover:text-red-700" />
                  {sidebarOpen && (
                    <span className="group-hover:text-red-700">{label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4">
          <button className="flex items-center gap-3 text-red-500 hover:text-red-700 transition w-full text-left">
            Log Out
          </button>
        </div>

        {/* Toggle Button (Desktop Only) - At the Bottom */}
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

      {/* Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Resident Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="text-black hover:text-red-700 focus:outline-none">
              <BellIcon className="w-6 h-6" />
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <img
                src={resident?.photo_url || "/default-profile.png"}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          {resident && (
            <div className="flex items-center gap-4 mb-6">
              <img
                src={resident.photo_url || "/default-profile.png"}
                alt="Profile"
                className="w-16 h-16 rounded-full border"
              />
              <h1 className="text-3xl font-semibold">
                Welcome, {resident.first_name} {resident.last_name}!
              </h1>
            </div>
          )}

          {/* Certificate Request Section */}
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl space-y-8">
            <h1 className="text-4xl font-bold text-center text-black mb-6">Request Certificate</h1>

            {message && (
              <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}

            {/* Choose certificate type first */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <label className="font-semibold text-black text-lg">Select Certificate Type:</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setFormData({}); }}
                className="border border-gray-300 p-3 rounded-xl text-black shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full md:w-auto"
              >
                <option value="">-- Choose --</option>
                {certificateForms.map((f) => (
                  <option key={f.type} value={f.type}>{f.type}</option>
                ))}
              </select>
            </div>

            {/* Show form only if a type is selected */}
            {selectedType && (
              <div className="border border-gray-200 p-6 rounded-2xl bg-gray-50 shadow-inner space-y-6">
                {certificateForms.find((f) => f.type === selectedType)?.requirements && (
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <p className="font-semibold text-black text-lg mb-3">Requirements:</p>
                    <ul className="list-disc list-inside text-black space-y-1">
                      {certificateForms.find((f) => f.type === selectedType)?.requirements.map((req, i) => (
                        <li key={i} className="text-gray-700">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificateForms.find((f) => f.type === selectedType)?.fields.map((field) => (
                    <input
                      key={field.name}
                      type="text"
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="border border-gray-300 p-4 rounded-xl w-full text-black shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    />
                  ))}
                </div>

                <button
                  onClick={submitRequest}
                  disabled={loading}
                  className="bg-red-600 text-white py-4 px-8 rounded-xl hover:bg-red-700 transition w-full font-semibold shadow-lg disabled:opacity-50"
                >
                  {loading ? "Submitting..." : `Submit ${selectedType}`}
                </button>
              </div>
            )}

            {/* Requests Table */}
            <div className="overflow-x-auto mt-8">
              <h2 className="text-3xl font-bold mb-4 text-black">Your Requests</h2>
              <table className="w-full text-left border-collapse bg-white rounded-xl shadow-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-b p-4 text-black font-semibold">ID</th>
                    <th className="border-b p-4 text-black font-semibold">Type</th>
                    <th className="border-b p-4 text-black font-semibold">Purpose</th>
                    <th className="border-b p-4 text-black font-semibold">Requested At</th>
                    <th className="border-b p-4 text-black font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.request_id} className="hover:bg-gray-50 transition">
                      <td className="border-b p-4 text-black">{req.request_id}</td>
                      <td className="border-b p-4 text-black">{req.certificate_type}</td>
                      <td className="border-b p-4 text-black">{req.purpose || "-"}</td>
                      <td className="border-b p-4 text-black">{new Date(req.requested_at).toLocaleDateString()}</td>
                      <td className={`border-b p-4 font-semibold ${statusColor(req.status)} px-3 py-1 rounded-full text-center`}>{req.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
