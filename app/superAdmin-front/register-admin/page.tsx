"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, UserPlus, Lock } from "lucide-react";

export default function RegisterAdminPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [devKey, setDevKey] = useState("");
  const [showDevKey, setShowDevKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    contact_no: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Dev key gate ─────────────────────────────────────────────────────────────
  const handleDevKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (devKey === process.env.NEXT_PUBLIC_DEV_ADMIN_KEY) {
      setAuthorized(true);
      setMessage(null);
    } else {
      setMessage({ type: "error", text: "Invalid developer key. Access denied." });
    }
  };

  // ── Form validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required.";
    if (!formData.username.trim()) newErrors.username = "Username is required.";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (formData.contact_no && !/^[0-9+\-\s]{7,15}$/.test(formData.contact_no)) {
      newErrors.contact_no = "Invalid contact number format.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // ── Register ──────────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/superadmin/register-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_DEV_ADMIN_KEY ?? "",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      setMessage({ type: "success", text: "Admin account created successfully! Redirecting…" });
      setTimeout(() => router.push("/auth-front/login"), 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Shared field component ────────────────────────────────────────────────────
  const Field = ({
    name,
    label,
    type = "text",
    placeholder,
    extra,
  }: {
    name: keyof typeof formData;
    label: string;
    type?: string;
    placeholder: string;
    extra?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          className={`w-full bg-slate-50 border rounded-lg px-3 py-2.5 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition ${
            errors[name]
              ? "border-red-400 focus:ring-red-200"
              : "border-slate-200 focus:ring-blue-200 focus:border-blue-400"
          }`}
        />
        {extra}
      </div>
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header card */}
        <div className="bg-blue-700 rounded-t-2xl px-6 py-5 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">Super Admin Panel</p>
            <h1 className="text-white text-xl font-bold leading-tight">
              {authorized ? "Register Admin Account" : "Developer Access"}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white rounded-b-2xl shadow-xl px-6 py-6">
          {!authorized ? (
            /* ── Dev key gate ── */
            <form onSubmit={handleDevKeySubmit} className="space-y-4">
              <p className="text-slate-500 text-sm">
                Enter your developer key to unlock the admin registration form.
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
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

              {message && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                Unlock
              </button>
            </form>
          ) : (
            /* ── Register form ── */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field name="first_name" label="First Name" placeholder="Juan" />
                <Field name="last_name" label="Last Name" placeholder="dela Cruz" />
              </div>

              <Field name="username" label="Username" placeholder="admin_username" />

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 border rounded-lg px-3 pr-10 py-2.5 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition ${
                      errors.password
                        ? "border-red-400 focus:ring-red-200"
                        : "border-slate-200 focus:ring-blue-200 focus:border-blue-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <Field name="contact_no" label="Contact Number" placeholder="+63 9XX XXX XXXX" />

              {message && (
                <div
                  className={`text-sm rounded-lg px-4 py-3 border ${
                    message.type === "success"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? "Creating account…" : "Register Admin"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Barangay Management System · Super Admin
        </p>
      </div>
    </div>
  );
}