"use client";
import { useEffect, useState } from "react";
import { Role, RegistrationStatus } from "@prisma/client";

interface RegistrationRequest {
  request_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  role: Role;
  status: RegistrationStatus;
  contact_no?: string | null;
  birthdate: string;
}

export default function ApproveRegistrationPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/auth/approve-registration/");
      if (!res.ok) throw new Error("Failed to fetch pending registrations");
      const data: RegistrationRequest[] = await res.json();
      setRequests(data);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load pending registrations");
    }
  };

  const approve = async (id: number) => {
    setMessage("Approving...");
    try {
      const res = await fetch("/api/auth/approve-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approverId: 1 }), // replace 1 with actual approver
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Approval failed");
      }

      const data = await res.json();
      setMessage(data.message);
      fetchPending();
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Approval failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Registrations</h1>
      {message && <p className="mb-4">{message}</p>}

      {requests.length === 0 ? (
        <p>No pending registrations</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-3 py-2">Name</th>
              <th className="border px-3 py-2">Email</th>
              <th className="border px-3 py-2">Role</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.request_id}>
                <td className="border px-3 py-2">{req.first_name} {req.last_name}</td>
                <td className="border px-3 py-2">{req.email ?? "No email provided"}</td>
                <td className="border px-3 py-2">{req.role}</td>
                <td className="border px-3 py-2">
                  <button
                    onClick={() => approve(req.request_id)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
