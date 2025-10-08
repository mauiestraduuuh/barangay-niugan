"use client";
import { useState } from "react";

export default function RegistrationPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contact_no: "",
    birthdate: "",
    role: "RESIDENT",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Submitting...");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {message && <p className="mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} className="w-full border px-2 py-1" required />
        <input type="text" name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} className="w-full border px-2 py-1" required />
        <input type="email" name="email" placeholder="Email (Optional)" value={form.email} onChange={handleChange} className="w-full border px-2 py-1" required />
        <input type="text" name="contact_no" placeholder="Contact Number" value={form.contact_no} onChange={handleChange} className="w-full border px-2 py-1" />
        <input type="date" name="birthdate" value={form.birthdate} onChange={handleChange} className="w-full border px-2 py-1" required />
        <select name="role" value={form.role} onChange={handleChange} className="w-full border px-2 py-1">
          <option value="RESIDENT">Resident</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Register</button>
      </form>
    </div>
  );
}
