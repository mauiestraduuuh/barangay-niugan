"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Home } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type PageState = "loading" | "choice" | "submitting" | "done" | "error" | "invalid";

type DoneResult = {
  choice: "departure" | "staying";
  message: string;
};

// ── Inner component (needs useSearchParams inside Suspense) ───────────────────
function ConfirmDeletionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<PageState>(token ? "choice" : "invalid");
  const [result, setResult] = useState<DoneResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const respond = async (choice: "departure" | "staying") => {
    setState("submitting");
    try {
      const res = await fetch(
        `/api/superadmin/reset-db/confirm?token=${token}&choice=${choice}`,
        { method: "PATCH" }
      );
      const data = await res.json();

      if (res.status === 409) {
        // Already responded
        setErrorMsg("You have already responded to this request.");
        setState("error");
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setResult({ choice, message: data.message });
      setState("done");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center p-6 font-serif">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #1a3a2a 0px,
            #1a3a2a 1px,
            transparent 1px,
            transparent 12px
          )`,
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Barangay seal / header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1a3a2a] mb-3 shadow-lg">
            <Home className="w-7 h-7 text-[#c9a84c]" />
          </div>
          <p className="text-[#1a3a2a] text-xs font-semibold uppercase tracking-[0.25em] opacity-60">
            Barangay Niugan
          </p>
          <h1 className="text-[#1a3a2a] text-2xl font-bold mt-1 leading-tight">
            Membership Confirmation
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#e8e0d0]">

          {/* ── CHOICE state ── */}
          {state === "choice" && (
            <>
              <div className="bg-[#1a3a2a] px-6 py-5">
                <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-1">
                  Action Required
                </p>
                <p className="text-white text-sm leading-relaxed">
                  The barangay is verifying its active members for this year. Please confirm your current status below.
                </p>
              </div>

              <div className="px-6 py-6 space-y-4">
                <p className="text-[#1a3a2a] text-base font-semibold text-center">
                  Are you still a resident or staff of Barangay Niugan?
                </p>

                {/* Yes button */}
                <button
                  onClick={() => respond("staying")}
                  className="w-full group relative overflow-hidden bg-[#1a3a2a] hover:bg-[#245038] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-3"
                >
                  <div className="bg-white/10 p-1.5 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-[#6fcf97]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Yes, I am still here</p>
                    <p className="text-xs text-white/60 font-normal">Keep my record in the barangay</p>
                  </div>
                </button>

                {/* No button */}
                <button
                  onClick={() => respond("departure")}
                  className="w-full group relative overflow-hidden bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-300 text-red-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center gap-3"
                >
                  <div className="bg-red-50 p-1.5 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-red-700">No, I have left</p>
                    <p className="text-xs text-red-400 font-normal">Remove my record from the barangay</p>
                  </div>
                </button>

                <p className="text-center text-xs text-[#1a3a2a]/40 pt-2">
                  Your response is final. Please choose carefully.
                </p>
              </div>
            </>
          )}

          {/* ── SUBMITTING state ── */}
          {state === "submitting" && (
            <div className="px-6 py-16 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#1a3a2a] animate-spin" />
              <p className="text-[#1a3a2a] font-semibold text-sm">Recording your response…</p>
            </div>
          )}

          {/* ── DONE state ── */}
          {state === "done" && result && (
            <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
              {result.choice === "staying" ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-[#1a3a2a] text-xl font-bold">Welcome Back!</h2>
                    <p className="text-[#1a3a2a]/60 text-sm mt-1 leading-relaxed">
                      Your record has been kept. Thank you for confirming your membership with Barangay Niugan.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-[#1a3a2a] text-xl font-bold">Response Recorded</h2>
                    <p className="text-[#1a3a2a]/60 text-sm mt-1 leading-relaxed">
                      Thank you for letting us know. Your record will be removed from the barangay database. We wish you well.
                    </p>
                  </div>
                </>
              )}
              <div className="mt-2 bg-[#f5f0e8] rounded-xl px-4 py-3 w-full">
                <p className="text-xs text-[#1a3a2a]/50 font-medium">
                  You may now close this page.
                </p>
              </div>
            </div>
          )}

          {/* ── ERROR state ── */}
          {state === "error" && (
            <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-9 h-9 text-red-500" />
              </div>
              <div>
                <h2 className="text-[#1a3a2a] text-xl font-bold">Unable to Process</h2>
                <p className="text-[#1a3a2a]/60 text-sm mt-1 leading-relaxed">{errorMsg}</p>
              </div>
              <button
                onClick={() => setState("choice")}
                className="text-sm text-[#1a3a2a] underline underline-offset-2 hover:opacity-60 transition"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── INVALID state (no token in URL) ── */}
          {state === "invalid" && (
            <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <AlertTriangle className="w-9 h-9 text-slate-400" />
              </div>
              <div>
                <h2 className="text-[#1a3a2a] text-xl font-bold">Invalid Link</h2>
                <p className="text-[#1a3a2a]/60 text-sm mt-1 leading-relaxed">
                  This confirmation link is invalid or has expired. Please use the link sent to you via SMS.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#1a3a2a]/40 mt-6">
          Barangay Niugan Management System
        </p>
      </div>
    </div>
  );
}

// ── Page export (wraps in Suspense for useSearchParams) ───────────────────────
export default function ConfirmDeletionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#1a3a2a] animate-spin" />
        </div>
      }
    >
      <ConfirmDeletionContent />
    </Suspense>
  );
}