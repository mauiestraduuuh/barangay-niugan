"use client";

import { useState } from "react";
import axios from "axios";

export default function NoEmailStatusPage() {
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const checkStatus = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await axios.get(`/api/auth/no-email?ref=${encodeURIComponent(ref)}`);
      setResult(res.data.request);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-6 text-red-500">Check Your Registration Status</h1>
      
      <div className="flex flex-col w-full max-w-md gap-4">
            <input
        type="text"
        placeholder="Enter Reference Number"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        className="p-3 rounded border border-red-500 text-black font-semibold bg-white"
        />

        <button
          onClick={checkStatus}
          className="bg-red-500 text-white font-bold py-3 rounded hover:bg-red-600 transition"
          disabled={loading || !ref.trim()}
        >
          {loading ? "Checking..." : "Check Status"}
        </button>
      </div>

      <div className="mt-6 w-full max-w-md">
        {error && <p className="text-red-500 font-bold">{error}</p>}

        {result && (
          <div className="bg-white text-black p-4 rounded shadow">
            <p>
              <strong>Name:</strong> {result.first_name} {result.last_name}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={
                result.status === "APPROVED" ? "text-green-600" :
                result.status === "REJECTED" ? "text-red-600" :
                "text-yellow-600"
              }>
                {result.status}
              </span>
            </p>
            <p>
              <strong>Role:</strong> {result.role}
            </p>
            {result.status === "APPROVED" && (
              <>
                <p>
                  <strong>Username:</strong> {result.username}
                </p>
                <p>
                  <strong>Temporary Password:</strong> {result.temp_password}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
