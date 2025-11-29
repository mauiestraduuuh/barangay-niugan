"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [forgotForm, setForgotForm] = useState({
    username: "",
    householdNumber: "",
    newPassword: "",
  });

  const [message, setMessage] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, type: "login" | "forgot") => {
    if (type === "login")
      setForm({ ...form, [e.target.name]: e.target.value });
    else
      setForgotForm({ ...forgotForm, [e.target.name]: e.target.value });
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

      if (!res.ok) return setMessage(data.message || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.resident_id)
        localStorage.setItem("resident_id", data.user.resident_id.toString());
      else localStorage.removeItem("resident_id");

      if (data.user.role === "ADMIN")
        localStorage.setItem("admin_id", data.user.id.toString());
      else localStorage.removeItem("admin_id");

      setMessage("Login successful! Redirecting...");
      router.push(data.redirectUrl);
    } catch (err) {
      console.error(err);
      setMessage("An error occurred during login");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage("Resetting password...");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: forgotForm.username,
          household_number: forgotForm.householdNumber,
          new_password: forgotForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) return setForgotMessage(data.message || "Password reset failed");

      setForgotMessage("Password reset successfully!");
      setShowForgot(false);
    } catch (err) {
      console.error(err);
      setForgotMessage("An error occurred while resetting password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900 to-black flex items-center justify-center p-4 relative">
      <button
        className="absolute top-4 left-4 p-2 backdrop-blur-xl rounded-full hover:bg-red-700 transition"
        onClick={() => router.push("/barangay-niugan")}
      >
        <ArrowLeftIcon className="h-6 w-6 text-white" />
      </button>

      <div className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row w-full max-w-[800px] overflow-hidden">

        {/* LEFT SIDE */}
        <div className="md:w-1/2 w-full bg-black text-white flex flex-col items-center justify-center p-10">
          <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-sm text-gray-300 text-center">
            Login to access your barangay services and dashboard.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="md:w-1/2 w-full p-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Login</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-black">

            <input
              type="text"
              name="username"
              placeholder="Username"
              onChange={(e) => handleChange(e, "login")}
              required
              className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-gray-900"
            />

            {/* Password with Show/Hide */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={(e) => handleChange(e, "login")}
                required
                className="border w-full border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="button"
                className="absolute right-4 top-3.5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-700" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-700" />
                )}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-md hover:bg-red-600 transition"
            >
              Login
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-700">
            Don’t have an account?{" "}
            <a href="/auth-front/register" className="text-gray-900 font-semibold hover:text-red-600">
              Register
            </a>
          </p>

          <p
            className="text-sm text-center mt-2 text-gray-700 hover:text-red-600 cursor-pointer"
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </p>

          {message && <p className="mt-4 text-center text-gray-800">{message}</p>}

          {/* FORGOT PASSWORD MODAL */}
          {showForgot && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-xl w-full max-w-sm relative">

                <h3 className="text-xl font-semibold mb-4">Reset Password</h3>

                <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    onChange={(e) => handleChange(e, "forgot")}
                    required
                    className="border border-gray-300 p-2 rounded-md"
                  />

                  <input
                    type="text"
                    name="householdNumber"
                    placeholder="Household Number"
                    onChange={(e) => handleChange(e, "forgot")}
                    required
                    className="border border-gray-300 p-2 rounded-md"
                  />

                  <div className="relative">
                    <input
                      type={showForgotPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="New Password"
                      onChange={(e) => handleChange(e, "forgot")}
                      required
                      className="border border-gray-300 p-2 w-full rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5"
                      onClick={() => setShowForgotPassword(!showForgotPassword)}
                    >
                      {showForgotPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-700" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-700" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between mt-2">
                    <button
                      type="submit"
                      className="bg-gray-900 text-white py-2 px-4 rounded hover:bg-red-600 transition"
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      className="text-gray-700 underline"
                      onClick={() => setShowForgot(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {forgotMessage && <p className="mt-2 text-center text-gray-800">{forgotMessage}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
