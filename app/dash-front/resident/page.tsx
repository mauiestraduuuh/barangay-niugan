"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface ResidentProfile {
  resident_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  gender?: string;
  address?: string;
  contact_no?: string;
}

export default function ResidentProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ResidentProfile>({
    resident_id: 0,
    user_id: 0,
    first_name: "",
    last_name: "",
    birthdate: "",
    gender: "",
    address: "",
    contact_no: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) return setMessage("Unauthorized: No token found");
    try {
      const res = await axios.get("/api/dash/resident", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch profile");
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const updateProfile = async () => {
    if (!token) return setMessage("Unauthorized");
    setLoading(true);
    try {
      await axios.put("/api/dash/resident", profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Profile updated successfully");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile");
    }
    setLoading(false);
  };

  const changePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage("Passwords do not match");
      return;
    }
    if (!token) return setMessage("Unauthorized");
    setLoading(true);
    try {
      await axios.patch(
        "/api/dash/resident",
        {
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Password updated successfully");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      console.error(err);
      setMessage("Failed to update password");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[linear-gradient(90deg,rgba(2,0,36,1)_0%,rgba(156,11,11,1)_43%,rgba(255,255,255,1)_100%)] p-6">
      <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg w-full max-w-xl overflow-hidden p-8 space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/dash-front/the-dash-resident")}
          className="flex items-center text-black font-semibold mb-4 hover:text-red-600 transition-colors"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-center mb-4 text-black">Manage Profile</h1>

        {message && (
          <p className="text-center text-white bg-gray-900 p-2 rounded">{message}</p>
        )}

        {/* Profile Info */}
        <div className="space-y-3">
          <input
            type="text"
            name="first_name"
            value={profile.first_name}
            onChange={handleProfileChange}
            placeholder="First Name"
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
          />
          <input
            type="text"
            name="last_name"
            value={profile.last_name}
            onChange={handleProfileChange}
            placeholder="Last Name"
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
          />
          <input
            type="date"
            name="birthdate"
            value={profile.birthdate.split("T")[0]}
            onChange={handleProfileChange}
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
          />
          <input
            type="text"
            name="contact_no"
            value={profile.contact_no || ""}
            onChange={handleProfileChange}
            placeholder="Contact Number"
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
          />
          <input
            type="text"
            name="address"
            value={profile.address || ""}
            onChange={handleProfileChange}
            placeholder="Address"
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
          />
          <button
            onClick={updateProfile}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-red-600 transition duration-300"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Change Password */}
        <div className="space-y-3 mt-6">
          <input
            type="password"
            name="current_password"
            value={passwords.current_password}
            onChange={handlePasswordChange}
            placeholder="Current Password"
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
          />
          <input
            type="password"
            name="new_password"
            value={passwords.new_password}
            onChange={handlePasswordChange}
            placeholder="New Password"
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
          />
          <input
            type="password"
            name="confirm_password"
            value={passwords.confirm_password}
            onChange={handlePasswordChange}
            placeholder="Confirm New Password"
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
          />
          <button
            onClick={changePassword}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-red-600 transition duration-300"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
