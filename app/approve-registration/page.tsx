"use client";

import { useEffect, useState } from "react";
import { Role, RegistrationStatus } from "@prisma/client";

// Type of data fetched from backend
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
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | null;
    id: number | null;
    step: "confirm" | "success" | null;
  }>({ type: null, id: null, step: null });

  // Fetch pending registrations on load
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
    }
  };

  // Handle approve or reject
  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/auth/approve-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approverId: 1, action }),
      });

      if (!res.ok) throw new Error("Action failed");

      setConfirmAction({ type: action, id, step: "success" });

      setTimeout(() => {
        setConfirmAction({ type: null, id: null, step: null });
        fetchPending();
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 relative">
      <div className="w-[90%] max-w-6xl bg-white rounded-2xl shadow-md p-8 relative">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Pending Registration Requests
        </h1>

        {requests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No pending registrations 🎉
          </div>
        ) : (
          <div
            className={`transition-all duration-200 ${
              confirmAction.type ? "blur-sm pointer-events-none" : ""
            }`}
          >
            <table className="w-full border border-gray-200 rounded-lg text-gray-800">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.request_id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {req.first_name} {req.last_name}
                    </td>
                    <td className="py-3 px-4">
                      {req.email ?? "No email provided"}
                    </td>
                    <td className="py-3 px-4">{req.role}</td>
                    <td className="py-3 px-4 flex items-center justify-center gap-3">
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: "approve",
                            id: req.request_id,
                            step: "confirm",
                          })
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: "reject",
                            id: req.request_id,
                            step: "confirm",
                          })
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Centered Modal */}
      {confirmAction.type && confirmAction.step === "confirm" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <div className="bg-white rounded-xl shadow-lg p-8 w-[400px] text-center">
            <h2 className="text-xl font-semibold mb-4">
              {confirmAction.type === "approve"
                ? "Approve Application?"
                : "Reject Application?"}
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to{" "}
              <span className="font-bold">
                {confirmAction.type === "approve" ? "approve" : "reject"}
              </span>{" "}
              this registration request?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() =>
                  handleAction(confirmAction.id!, confirmAction.type!)
                }
                className={`px-4 py-2 rounded-md text-white ${
                  confirmAction.type === "approve"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Yes, {confirmAction.type === "approve" ? "Approve" : "Reject"}
              </button>
              <button
                onClick={() =>
                  setConfirmAction({ type: null, id: null, step: null })
                }
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {confirmAction.step === "success" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <div className="bg-white rounded-xl shadow-lg p-8 w-[350px] text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {confirmAction.type === "approve"
                ? "Approved Successfully!"
                : "Rejected Successfully!"}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}
