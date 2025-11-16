"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterAdminPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [devKey, setDevKey] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    contact_no: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDevKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
   
    if (devKey === process.env.NEXT_PUBLIC_DEV_ADMIN_KEY) {
      setAuthorized(true);
      setMessage("");
    } else {
      setMessage("Invalid developer key!");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_DEV_ADMIN_KEY ?? "",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Something went wrong");
      setMessage("✅ Admin registered successfully!");
      setTimeout(() => router.push("/auth-front/login"), 2000);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white shadow-md rounded-2xl p-6">
        {!authorized ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Developer Access
            </h2>
            <form onSubmit={handleDevKeySubmit}>
              <input
                type="password"
                placeholder="Enter developer key"
                className="w-full border rounded-lg p-2 mb-3"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Unlock Form
              </button>
            </form>
            {message && <p className="text-red-500 mt-3 text-center">{message}</p>}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Register Admin
            </h2>
            <form onSubmit={handleRegister}>
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                className="w-full border rounded-lg p-2 mb-3"
                onChange={handleChange}
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                className="w-full border rounded-lg p-2 mb-3"
                onChange={handleChange}
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="w-full border rounded-lg p-2 mb-3"
                onChange={handleChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full border rounded-lg p-2 mb-3"
                onChange={handleChange}
              />
              <input
                type="text"
                name="contact_no"
                placeholder="Contact Number"
                className="w-full border rounded-lg p-2 mb-3"
                onChange={handleChange}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register Admin"}
              </button>
            </form>

            {message && (
              <p className="text-center mt-3 text-gray-700 font-medium">
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
