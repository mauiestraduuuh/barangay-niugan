"use client";

import { useState, useCallback } from "react";
import {
  Lock, Eye, EyeOff, DatabaseZap, Users, AlertTriangle,
  RefreshCw, Send, Trash2, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, ArrowLeft,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type InactiveRecord = {
  id: number;
  type: "resident" | "staff";
  full_name: string;
  contact_no: string | null;
  last_activity: string | null;
};

type ConfirmationStatus = {
  id: number;
  type: "resident" | "staff";
  full_name: string;
  contact_no: string | null;
  status: "pending" | "confirmed_departure" | "confirmed_staying" | "no_response";
  notified_at: string;
};

type Step = "gate" | "scan" | "notify" | "status" | "done";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ConfirmationStatus["status"], string> = {
  pending:             "Awaiting OTP",
  confirmed_departure: "Confirmed Departure",
  confirmed_staying:   "Still in Barangay",
  no_response:         "No Response",
};

const STATUS_COLOR: Record<ConfirmationStatus["status"], string> = {
  pending:             "bg-amber-100 text-amber-700 border-amber-200",
  confirmed_departure: "bg-red-100 text-red-700 border-red-200",
  confirmed_staying:   "bg-green-100 text-green-700 border-green-200",
  no_response:         "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_ICON: Record<ConfirmationStatus["status"], React.ReactNode> = {
  pending:             <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
  confirmed_departure: <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
  confirmed_staying:   <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
  no_response:         <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResetDatabasePage() {
  const [step, setStep] = useState<Step>("gate");

  const [devKey, setDevKey]         = useState("");
  const [showDevKey, setShowDevKey] = useState(false);

  const [inactiveRecords, setInactiveRecords] = useState<InactiveRecord[]>([]);
  const [confirmations, setConfirmations]     = useState<ConfirmationStatus[]>([]);

  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [expandResidents, setExpandResidents]   = useState(true);
  const [expandStaff, setExpandStaff]           = useState(true);
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [purgeInput, setPurgeInput]             = useState("");

  const currentYear = new Date().getFullYear();
  const authHeader  = { "x-admin-secret": process.env.NEXT_PUBLIC_DEV_ADMIN_KEY ?? "" };

  // ── Step 1: Gate ─────────────────────────────────────────────────────────────
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (devKey === process.env.NEXT_PUBLIC_DEV_ADMIN_KEY) {
      setStep("scan");
      setError(null);
    } else {
      setError("Invalid developer key. Access denied.");
    }
  };

  // ── Step 2: Scan ─────────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/superadmin/reset-db/scan", { headers: authHeader });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Scan failed.");
      setInactiveRecords(data.inactive ?? []);
      setStep("notify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── View current status (skip scan) ──────────────────────────────────────────
  const handleViewStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/superadmin/reset-db/status", { headers: authHeader });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch status.");
      if ((data.confirmations ?? []).length === 0) {
        setError("No existing notifications found. Run a scan first.");
        return;
      }
      setConfirmations(data.confirmations);
      setStep("status");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Notify ────────────────────────────────────────────────────────────
  const handleNotify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/reset-db/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          records: inactiveRecords.map((r) => ({ id: r.id, type: r.type })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Notification failed.");
      setStep("status");
      await handleRefreshStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Refresh status ────────────────────────────────────────────────────
  const handleRefreshStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/superadmin/reset-db/status", { headers: authHeader });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch status.");
      setConfirmations(data.confirmations ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 5: Purge ─────────────────────────────────────────────────────────────
  const handlePurge = async () => {
    if (purgeInput !== "DELETE") return;
    setLoading(true);
    setError(null);
    setPurgeConfirmOpen(false);
    try {
      const toDeleteIds = confirmations
        .filter((c) => c.status === "confirmed_departure")
        .map((c) => c.id);

      const res = await fetch("/api/superadmin/reset-db/purge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ ids: toDeleteIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Purge failed.");
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const residents = inactiveRecords.filter((r) => r.type === "resident");
  const staffs    = inactiveRecords.filter((r) => r.type === "staff");
  const toDelete  = confirmations.filter((c) => c.status === "confirmed_departure");
  const pending   = confirmations.filter((c) => c.status === "pending");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-red-50 to-slate-200 flex items-start sm:items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="bg-red-700 rounded-t-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg shrink-0">
            <DatabaseZap className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-red-200 text-xs font-semibold uppercase tracking-widest">Super Admin Panel</p>
            <h1 className="text-white text-lg sm:text-xl font-bold leading-tight">Reset Database</h1>
          </div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-xl px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 sm:px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="break-words min-w-0">{error}</span>
            </div>
          )}

          {/* ════ GATE ════ */}
          {step === "gate" && (
            <form onSubmit={handleUnlock} className="space-y-4">
              <p className="text-slate-500 text-sm">
                This action will scan for inactive records and post a public announcement
                before any deletion occurs. Enter your developer key to proceed.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Developer Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showDevKey ? "text" : "password"}
                    placeholder="Enter key…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                    value={devKey}
                    onChange={(e) => setDevKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDevKey(!showDevKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showDevKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                Unlock
              </button>
            </form>
          )}

          {/* ════ SCAN ════ */}
          {step === "scan" && (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 sm:px-4 py-3 text-sm text-amber-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This will scan for residents and staff with{" "}
                  <strong>no recorded activity in {currentYear}</strong>. No data will be deleted
                  yet — notifications are sent first.
                </span>
              </div>
              <button
                onClick={handleScan}
                disabled={loading}
                className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2"
              >
                <DatabaseZap className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {loading ? "Scanning…" : `Scan for Inactive Records (${currentYear})`}
                </span>
              </button>
              <button
                onClick={handleViewStatus}
                disabled={loading}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
                View Current Status
              </button>
            </div>
          )}

          {/* ════ NOTIFY ════ */}
          {step === "notify" && (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">{residents.length}</p>
                  <p className="text-xs text-blue-500 mt-1 font-medium">Inactive Residents</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-purple-700">{staffs.length}</p>
                  <p className="text-xs text-purple-500 mt-1 font-medium">Inactive Staff</p>
                </div>
              </div>

              {inactiveRecords.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  No inactive records found for {currentYear}. Database is clean!
                </div>
              ) : (
                <>
                  {residents.length > 0 && (
                    <CollapsibleTable
                      title="Inactive Residents"
                      count={residents.length}
                      records={residents}
                      expanded={expandResidents}
                      onToggle={() => setExpandResidents(!expandResidents)}
                    />
                  )}
                  {staffs.length > 0 && (
                    <CollapsibleTable
                      title="Inactive Staff"
                      count={staffs.length}
                      records={staffs}
                      expanded={expandStaff}
                      onToggle={() => setExpandStaff(!expandStaff)}
                    />
                  )}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-3 text-xs text-slate-600">
                    A public announcement will be posted listing affected members. They visit the
                    barangay hall and give their OTP to staff, who enters it here to confirm their status.
                  </div>
                  <button
                    onClick={handleNotify}
                    disabled={loading}
                    className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {loading ? "Notifying…" : `Notify ${inactiveRecords.length} People & Post Announcement`}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* ════ STATUS ════ */}
          {step === "status" && (
            <div className="space-y-4 sm:space-y-5">

              {/* Stats — 2 cols mobile, 4 cols desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                {(["pending", "confirmed_departure", "confirmed_staying", "no_response"] as const).map((s) => {
                  const count = confirmations.filter((c) => c.status === s).length;
                  return (
                    <div key={s} className={`rounded-lg border px-2 py-2 ${STATUS_COLOR[s]}`}>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="leading-tight mt-0.5">{STATUS_LABEL[s]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Action row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleRefreshStatus}
                  disabled={loading}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
                  Refresh Status
                </button>
                <button
                  onClick={() => { setStep("scan"); setError(null); }}
                  disabled={loading}
                  className="sm:w-auto border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-2 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  Back to Scan
                </button>
              </div>

              {confirmations.length > 0 && (
                <>
                  {/* Mobile: card list */}
                  <div className="sm:hidden space-y-2">
                    {confirmations.map((c) => (
                      <div key={c.id} className="border border-slate-100 rounded-xl p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{c.full_name}</p>
                            <p className="text-xs text-slate-400 capitalize">{c.type}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium shrink-0 ${STATUS_COLOR[c.status]}`}>
                            {STATUS_ICON[c.status]}
                            <span className="hidden xs:inline">{STATUS_LABEL[c.status]}</span>
                          </span>
                        </div>
                        {c.status === "pending" && (
                          <OtpInput authHeader={authHeader} onSuccess={handleRefreshStatus} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Name</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Type</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Status</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Enter OTP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {confirmations.map((c) => (
                          <tr key={c.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-2 text-slate-800 font-medium">{c.full_name}</td>
                            <td className="px-3 py-2 text-slate-500 capitalize">{c.type}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_COLOR[c.status]}`}>
                                {STATUS_ICON[c.status]}
                                {STATUS_LABEL[c.status]}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {c.status === "pending" && (
                                <OtpInput authHeader={authHeader} onSuccess={handleRefreshStatus} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {toDelete.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 sm:px-4 py-3 text-sm text-red-700 flex gap-2">
                    <Trash2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>{toDelete.length} record{toDelete.length !== 1 ? "s" : ""}</strong>{" "}
                      confirmed departure and will be permanently deleted.
                      {pending.length > 0 && ` (${pending.length} still pending.)`}
                    </span>
                  </div>
                  <button
                    onClick={() => { setPurgeConfirmOpen(true); setPurgeInput(""); }}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Delete {toDelete.length} Confirmed Record{toDelete.length !== 1 ? "s" : ""}</span>
                  </button>
                </div>
              )}

              {toDelete.length === 0 && confirmations.length > 0 && (
                <p className="text-center text-sm text-slate-500">
                  No confirmed departures yet. Enter OTPs as residents/staff come in.
                </p>
              )}
            </div>
          )}

          {/* ════ DONE ════ */}
          {step === "done" && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-green-500 mx-auto" />
              <h2 className="text-lg font-bold text-slate-800">Database Reset Complete</h2>
              <p className="text-slate-500 text-sm">
                All confirmed departures have been removed. Records of residents and staff who
                confirmed they're staying — or didn't respond — were preserved.
              </p>
              <button
                onClick={() => {
                  setStep("scan");
                  setInactiveRecords([]);
                  setConfirmations([]);
                  setError(null);
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Run another scan
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Barangay Management System · Super Admin
        </p>
      </div>

      {/* ── Purge confirmation modal — slides up from bottom on mobile ── */}
      {purgeConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2.5 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Confirm Permanent Deletion</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              You are about to permanently delete{" "}
              <strong>{toDelete.length} record{toDelete.length !== 1 ? "s" : ""}</strong> from
              the database. Type{" "}
              <span className="font-mono font-bold text-red-600">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={purgeInput}
              onChange={(e) => setPurgeInput(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setPurgeConfirmOpen(false)}
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-2.5 rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePurge}
                disabled={purgeInput !== "DELETE" || loading}
                className="flex-1 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                {loading ? "Deleting…" : "Delete Records"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CollapsibleTable ──────────────────────────────────────────────────────────

function CollapsibleTable({
  title, count, records, expanded, onToggle,
}: {
  title: string;
  count: number;
  records: InactiveRecord[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-sm font-semibold text-slate-700"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{title}</span>
          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
            {count}
          </span>
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <>
          {/* Mobile: stacked cards */}
          <div className="sm:hidden divide-y divide-slate-50">
            {records.map((r) => (
              <div key={r.id} className="px-3 py-2.5">
                <p className="text-sm font-medium text-slate-800">{r.full_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.contact_no ?? "No contact"}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {r.last_activity
                    ? new Date(r.last_activity).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                    : "No activity recorded"}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="text-left px-4 py-2 text-slate-500 font-semibold">Name</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-semibold">Contact</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-semibold">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-4 py-2 text-slate-800 font-medium">{r.full_name}</td>
                    <td className="px-4 py-2 text-slate-500">{r.contact_no ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {r.last_activity
                        ? new Date(r.last_activity).toLocaleDateString("en-PH", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : "No activity recorded"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── OtpInput ──────────────────────────────────────────────────────────────────

function OtpInput({
  authHeader,
  onSuccess,
}: {
  authHeader: Record<string, string>;
  onSuccess: () => void;
}) {
  const [otp, setOtp]         = useState("");
  const [choice, setChoice]   = useState<"staying" | "departure">("staying");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/superadmin/reset-db/confirm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ otp, choice }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      onSuccess();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex gap-1 w-full">
        <input
          type="text"
          maxLength={6}
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="w-0 flex-1 min-w-0 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-300"
        />
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value as "staying" | "departure")}
          className="shrink-0 border border-slate-200 rounded px-1 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-300"
        >
          <option value="staying">Staying</option>
          <option value="departure">Leaving</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={loading || otp.length !== 6}
          className="shrink-0 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition"
        >
          {loading ? "…" : "OK"}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}