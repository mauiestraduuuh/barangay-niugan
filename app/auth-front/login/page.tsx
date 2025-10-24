"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");  // Changed from email
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {  // Changed to relative path
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),  // Changed from email
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      } else {
        console.error("No token received from backend");
        setMessage("Login failed: No token provided");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.resident_id) {
        localStorage.setItem("resident_id", data.user.resident_id.toString());
      } else {
        localStorage.removeItem("resident_id");
      }

      setMessage("Login successful! Redirecting...");
      router.push(data.redirectUrl);

    } catch (error) {
      console.error("Login error:", error);
      setMessage("An error occurred during login");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        {message && <p className="text-center text-red-500 mb-4">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"  // Changed from email
            placeholder="Enter Username"  // Updated placeholder
            className="w-full p-2 border rounded mb-4"
            value={username}  // Updated
            onChange={(e) => setUsername(e.target.value)}  // Updated
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="w-full p-2 border rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
