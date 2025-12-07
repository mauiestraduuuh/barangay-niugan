"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  ArrowLeftIcon
  } from "@heroicons/react/24/outline";

export default function NoEmailStatusPage() {
  const [ref, setRef] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [hasChecked, setHasChecked] = useState(false); 

  const checkStatus = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setHasChecked(true); 

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
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900 to-black flex items-center justify-center p-4">
      <button
        className="absolute top-4 left-4 p-2 backdrop-blur-xl rounded-full hover:bg-red-700 transition"
        onClick={() => router.push("/barangay-niugan")}
      >
        <ArrowLeftIcon className="h-6 w-6 text-white" />
      </button>
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg border border-red-500/50 rounded-3xl shadow-2xl p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-red-400 mb-4 animate-pulse" />
            <h1 className="text-3xl font-extrabold text-white mb-2">Resident Registration Status</h1>
            <p className="text-gray-300">Verify your status.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Input Form */}
          <div className="flex-1 bg-black/50 rounded-2xl p-6 border border-red-500/30">
            <h2 className="text-xl font-bold text-white mb-4">Enter Details</h2>
            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Reference Number"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-red-500/50 bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-300"
                />
              </div>
              <button
                onClick={checkStatus}
                className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white font-bold py-3 rounded-xl hover:from-red-600 hover:to-red-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading || !ref.trim()}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Checking...
                  </div>
                ) : (
                  "Check Status"
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          {hasChecked && (
            <div className="flex-1 bg-black/50 rounded-2xl p-6 border border-red-500/30 animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-4">Results</h2>
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
                    <p className="text-red-300 font-semibold">{error}</p>
                  </div>
                </div>
              )}
              {result && (
                <div className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-3">
                  <p className="flex justify-between">
                    <span className="font-semibold text-gray-300">Name:</span>
                    <span className="text-white">{result.first_name} {result.last_name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold text-gray-300">Status:</span>
                    <span className={`font-bold ${
                      result.status === "APPROVED" ? "text-green-400" :
                      result.status === "REJECTED" ? "text-red-400" :
                      "text-yellow-400"
                    }`}>
                      {result.status}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold text-gray-300">Role:</span>
                    <span className="text-white">{result.role}</span>
                  </p>
                  {result.status === "APPROVED" && (
                    <>
                      <p className="flex justify-between">
                        <span className="font-semibold text-gray-300">Username:</span>
                        <span className="text-white">{result.username}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-semibold text-gray-300">Temp Password:</span>
                        <span className="text-white">{result.temp_password}</span>
                      </p>
                      {result.household_number && (
                        <p className="flex justify-between">
                          <span className="font-semibold text-gray-300">Household Number:</span>
                          <span className="text-white">{result.household_number.replace(/^HH-/, "")}</span>
                        </p>
                      )}
                      <div className="mt-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                        ⚠️ All members of your family should use the same <strong>Household Number</strong>. <br/>
                        Please change your <strong>temporary password</strong> immediately after logging in.
                      </div>
                      {/* LOGIN BUTTON */}
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => router.push("/auth-front/login")}
                          className="mt-2 inline-block px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
                        >
                          Login
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fade-in animation */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
