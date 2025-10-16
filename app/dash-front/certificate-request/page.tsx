"use client";

import { useEffect, useState } from "react";
import axios from "axios";

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

export default function CertificateRequestPage() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  useEffect(() => {
    fetchRequests();
  }, [token]);

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

  return (
    <div className="min-h-screen p-6 bg-[linear-gradient(90deg,rgba(2,0,36,1)_0%,rgba(156,11,11,1)_43%,rgba(255,255,255,1)_100%)]">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-black mb-4">Request Certificate</h1>

        {message && <p className="text-center text-white bg-red-600 p-2 rounded">{message}</p>}

        {/* Choose certificate type first */}
        <div className="flex gap-4 items-center">
          <label className="font-semibold text-black">Select Certificate Type:</label>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setFormData({}); }}
            className="border border-black p-2 rounded text-black"
          >
            <option value="">-- Choose --</option>
            {certificateForms.map((f) => (
              <option key={f.type} value={f.type}>{f.type}</option>
            ))}
          </select>
        </div>

        {/* Show form only if a type is selected */}
        {selectedType && (
          <div className="border border-black p-4 rounded-lg bg-gray-50 shadow-sm mt-4">
            {certificateForms.find((f) => f.type === selectedType)?.requirements && (
              <div className="mb-2">
                <p className="font-semibold text-black">Requirements:</p>
                <ul className="list-disc list-inside text-black">
                  {certificateForms.find((f) => f.type === selectedType)?.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {certificateForms.find((f) => f.type === selectedType)?.fields.map((field) => (
              <input
                key={field.name}
                type="text"
                placeholder={field.placeholder}
                value={formData[field.name] || ""}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="border border-black p-2 rounded w-full mb-2 text-black"
              />
            ))}

            <button
              onClick={submitRequest}
              disabled={loading}
              className="bg-black text-white py-2 px-4 rounded hover:bg-red-600 transition w-full"
            >
              {loading ? "Submitting..." : `Submit ${selectedType}`}
            </button>
          </div>
        )}

        {/* Requests Table */}
        <div className="overflow-x-auto mt-6">
          <h2 className="text-2xl font-bold mb-3 text-black">Your Requests</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2 text-black">ID</th>
                <th className="border-b p-2 text-black">Type</th>
                <th className="border-b p-2 text-black">Purpose</th>
                <th className="border-b p-2 text-black">Requested At</th>
                <th className="border-b p-2 text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.request_id} className="hover:bg-gray-100">
                  <td className="border-b p-2 text-black">{req.request_id}</td>
                  <td className="border-b p-2 text-black">{req.certificate_type}</td>
                  <td className="border-b p-2 text-black">{req.purpose || "-"}</td>
                  <td className="border-b p-2 text-black">{new Date(req.requested_at).toLocaleDateString()}</td>
                  <td className={`border-b p-2 font-semibold ${statusColor(req.status)}`}>{req.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
