"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

          // Save token
      if (data.token) {
        localStorage.setItem("token", data.token);
      } else {
        console.error("No token received from backend");
        setMessage("Login failed: No token provided");
        return;
      }

      // Save user data
      localStorage.setItem("user", JSON.stringify(data.user));

      // Save resident_id if exists
      if (data.user.resident_id) {
        localStorage.setItem("resident_id", data.user.resident_id.toString());
      } else {
        localStorage.removeItem("resident_id");
      }

      // Save admin_id if user is ADMIN
      if (data.user.role === "ADMIN") {
        localStorage.setItem("admin_id", data.user.id.toString());
      } else {
        localStorage.removeItem("admin_id");
      }


      setMessage("Login successful! Redirecting...");
      router.push(data.redirectUrl); // Use dynamic redirect from backend

    } catch (err) {
      console.error("Login error:", err);
      setMessage("An error occurred during login");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[linear-gradient(90deg,rgba(2,0,36,1)_0%,rgba(156,11,11,1)_43%,rgba(255,255,255,1)_100%)] h-screen">
      <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg flex w-[800px] overflow-hidden">
        {/* Left side */}
        <div className="w-1/2 bg-black text-white flex flex-col items-center justify-center p-10">
          <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-sm text-gray-300 text-center">
            Login to access your barangay services and dashboard.
          </p>
        </div>

        {/* Right side (Login form) */}
        <div className="w-1/2 p-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Login</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="username"
              placeholder="Username" // Changed from "Email" to match backend
              onChange={handleChange}
              required
              className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
              className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-md hover:bg-red-600 hover:text-white transition duration-300"
            >
              Login
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-700">
            Don’t have an account?{" "}
            <a
              href="/register"
              className="text-gray-900 font-semibold hover:text-red-600 transition-colors"
            >
              Register
            </a>
          </p>

          {message && <p className="mt-4 text-center text-gray-800">{message}</p>}
        </div>
      </div>
    </div>
  );
}
