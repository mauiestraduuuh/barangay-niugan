"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface RegistrationCode {
  id: number;
  code: string;
  ownerName: string;
  isUsed: boolean;
  usedById?: number | null;
}

export default function RegistrationCodePage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all registration codes
  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/registration-code");
      if (res.data.success) {
        setCodes(res.data.codes);
      } else {
        setMessage(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch codes");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Generate a new code
  const generateCode = async () => {
    if (!ownerName.trim()) {
      setMessage("Owner name is required");
      return;
    }

    try {
      const res = await axios.post("/api/admin/registration-code", { ownerName });
      if (res.data.success) {
        setMessage("Code generated successfully!");
        setOwnerName("");
        fetchCodes();
      } else {
        setMessage(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to create code");
    }
  };

  // Delete unused code
  const deleteCode = async (id: number) => {
    if (!confirm("Are you sure you want to delete this code?")) return;

    try {
      const res = await axios.delete("/api/admin/registration-code", { data: { id } });
      if (res.data.success) {
        setMessage("Code deleted successfully");
        fetchCodes();
      } else {
        setMessage(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete code");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Registration Codes</h1>

      {message && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">{message}</div>
      )}

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Owner name"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          onClick={generateCode}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Generate
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full border border-gray-200 rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-2 font-medium">{c.code}</td>
                <td className="px-4 py-2">{c.ownerName}</td>
                <td className="px-4 py-2 text-center">
                  {c.isUsed ? "USED" : "UNUSED"}
                </td>
                <td className="px-4 py-2 text-center">
                  {!c.isUsed && (
                    <button
                      onClick={() => deleteCode(c.id)}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
