"use client";
import { useEffect, useState } from "react";
import { Role, RegistrationStatus } from "@prisma/client";
import { LogOut, Home, Users, ClipboardCheck } from "lucide-react"; // nice dashboard icons

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
      setMessage("⚠️ Failed to load pending registrations");
    }
  };

  const approve = async (id: number) => {
    setMessage("Approving...");
    try {
      const res = await fetch("/api/auth/approve-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approverId: 1 }),
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
    <div className="min-h-screen flex bg-black  text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-white">Staff Dashboard</h2>
        </div>

        <nav className="flex flex-col space-y-4">
          <a
            href="#"
            className="flex items-center gap-3 text-gray-300 hover:text-white transition"
          >
            <Home size={20} /> Home
          </a>
          <a
            href="#"
            className="flex items-center gap-3 text-gray-300 hover:text-white transition"
          >
            <Users size={20} /> Manage Users
          </a>
          <a
            href="#"
            className="flex items-center gap-3 text-gray-300 hover:text-white transition"
          >
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
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => approve(req.request_id)}
                          className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105"
                        >
                          Approve
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
    </div>
  );
}