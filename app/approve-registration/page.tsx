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

  const [fadeOut, setFadeOut] = useState(false); // for smooth fade

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

  const handleAction = async (action: "approve" | "reject", id: number) => {
    try {
      const endpoint =
        action === "approve"
          ? "/api/auth/approve-registration"
          : "/api/auth/reject-registration";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approverId: 1 }), // replace with actual approverId
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `${action} failed`);

      setConfirmAction({ type: action, id, step: "success" });
      setMessage(data.message || `${action} successful`);
      setRequests((prev) => prev.filter((r) => r.request_id !== id));
    } catch (err) {
      console.error(`${action} failed:`, err);
      setMessage(`${action} failed. Please try again.`);
    }
  };

  // Auto-close modal with fade effect
  useEffect(() => {
    if (confirmAction.step === "success") {
      const fadeTimer = setTimeout(() => setFadeOut(true), 1000); // start fade
      const closeTimer = setTimeout(() => {
        setConfirmAction({ type: null, id: null, step: null });
        setFadeOut(false);
      }, 1500); // fully close

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [confirmAction.step]);

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
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500"
          style={{ opacity: fadeOut ? 0 : 1 }}
        >
          <div
            className="bg-white/10 border border-white/20 rounded-2xl p-8 text-center max-w-sm transition-transform duration-500"
            style={{ transform: fadeOut ? "scale(0.95)" : "scale(1)" }}
          >
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
                        confirmAction.type as "approve" | "reject",
                        confirmAction.id!
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
                ✅ {confirmAction.type === "approve" ? "Approved" : "Rejected"} successfully!
              </h2>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
