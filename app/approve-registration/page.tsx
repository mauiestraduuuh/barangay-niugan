"use client";
import { useEffect, useState } from "react";
import { Role, RegistrationStatus } from "@prisma/client";
import { LogOut, Home, Users, ClipboardCheck, X, Check } from "lucide-react";

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
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | null;
    id: number | null;
    step: "confirm" | "success" | null;
  }>({ type: null, id: null, step: null });

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
      setMessage("⚠️ Failed to load pending registrations");
    }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setMessage(`${action === "approve" ? "Approving" : "Rejecting"}...`);
    try {
      const res = await fetch("/api/auth/approve-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approverId: 1, action }),
      });

      const data = await res.json(); // ✅ must come before checking res.ok

      if (!res.ok) throw new Error(data?.message || `${action} failed`);

      setConfirmAction({ type: action, id, step: "success" });
      setMessage(data.message || `${action} successful`);

      // ✅ Refresh list after success
      setTimeout(() => {
        setConfirmAction({ type: null, id: null, step: null });
        fetchPending();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ ${action} failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex bg-black text-white relative">
      {/* Sidebar */}
      <aside className="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-white">Staff Dashboard</h2>
        </div>

        <nav className="flex flex-col space-y-4">
          <a href="#" className="flex items-center gap-3 text-gray-300 hover:text-white transition">
            <Home size={20} /> Home
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-300 hover:text-white transition">
            <Users size={20} /> Manage Users
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-300 hover:text-white transition">
            <ClipboardCheck size={20} /> Approve Registrations
          </a>
        </nav>

        <div className="mt-auto">
          <button className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Pending Registrations</h1>
          <div className="bg-white/10 px-4 py-2 rounded-lg text-sm text-gray-200">
            Welcome, Staff Member
          </div>
        </header>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-8">
          {message && (
            <p className="text-center mb-4 bg-black/30 px-4 py-2 rounded-md text-gray-200">
              {message}
            </p>
          )}

          {requests.length === 0 ? (
            <div className="text-center text-gray-300 py-10">
              No pending registrations 🎉
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-200 border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-white/10 text-gray-100">
                    <th className="px-5 py-3 rounded-l-lg">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3 rounded-r-lg text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.request_id}
                      className="bg-white/5 hover:bg-white/15 transition rounded-lg"
                    >
                      <td className="px-5 py-3">
                        {req.first_name} {req.last_name}
                      </td>
                      <td className="px-5 py-3">
                        {req.email ?? "No email provided"}
                      </td>
                      <td className="px-5 py-3">{req.role}</td>
                      <td className="px-5 py-3 text-center space-x-2">
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: "approve",
                              id: req.request_id,
                              step: "confirm",
                            })
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105 inline-flex items-center gap-1"
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: "reject",
                              id: req.request_id,
                              step: "confirm",
                            })
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105 inline-flex items-center gap-1"
                        >
                          <X size={16} /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {confirmAction.step && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-8 text-center max-w-sm">
            {confirmAction.step === "confirm" && (
              <>
                <h2 className="text-xl mb-4 font-semibold">
                  {confirmAction.type === "approve"
                    ? "Approve this registration?"
                    : "Reject this registration?"}
                </h2>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() =>
                      handleAction(
                        confirmAction.id!,
                        confirmAction.type as "approve" | "reject"
                      )
                    }
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() =>
                      setConfirmAction({ type: null, id: null, step: null })
                    }
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {confirmAction.step === "success" && (
              <h2 className="text-lg text-green-400">
                ✅ {confirmAction.type === "approve" ? "Approved" : "Rejected"}{" "}
                successfully!
              </h2>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
