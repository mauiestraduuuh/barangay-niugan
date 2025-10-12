"use client"; // run on browser not on server

import { useState } from "react"; // import from react to manage input, photo, messages

// state variables
export default function RegisterPage() {
  const [form, setForm] = useState({

    // empty strings for default value
    first_name: "",
    last_name: "",
    email: "",
    contact_no: "",
    birthdate: "",
    gender: "",
    address: "",
    role: "RESIDENT", // change this, regitration must not be exclusive to residents

    // boolean for checkboxes
    is_head_of_family: false,
    is_4ps_member: false,
    is_pwd: false,
    is_indigenous: false,
    is_slp_beneficiary: false,
  });

  const [photo, setPhoto] = useState<File | null>(null); // stores uploaded photo
  const [message, setMessage] = useState(""); //

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const { name, value } = target;

  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    // Handle checkbox specifically
    setForm((prev) => ({ ...prev, [name]: target.checked }));
  } else {
    // Handle text, select, and textarea
    setForm((prev) => ({ ...prev, [name]: value }));
  }
};

// prevent page from reloading when submitting
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // creates form data (we are using formData, this is ideal for file uploads)
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    if (photo) formData.append("photo", photo);

    // sends POST request
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      // handle response
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Registration failed");
        return;
      }
      setMessage("Registration submitted successfully!");

      // clears the form for new registration
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        contact_no: "",
        birthdate: "",
        gender: "",
        address: "",
        role: "RESIDENT",
        is_head_of_family: false,
        is_4ps_member: false,
        is_pwd: false,
        is_indigenous: false,
        is_slp_beneficiary: false,
      });
      setPhoto(null);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while submitting.");
    }
  };

  return (
<div className="relative flex min-h-screen items-center justify-center bg-[linear-gradient(90deg,rgba(255,0,0,1)_0%,rgba(0,0,0,1)_50%,rgba(255,255,255,1)_100%)] h-screen">

  <div className="relative z-10 bg-black/80 backdrop-blur-lg shadow-2xl max-w-4xl w-full rounded-2xl p-8 border border-white/40 flex flex-col md:flex-row gap-8">
    {/* Left side — heading */}
    <div className="flex-1 flex flex-col justify-center text-center md:text-left">
      <h1 className="text-3xl font-bold font-poppins text-white mb-3">
        Register 
      </h1>
      <p className="text-white text-sm leading-relaxed">
        Fill in your details to keep our community database updated and accessible.
      </p>
    </div>

    {/* Right side — form */}
    <div className="flex-1 bg-white rounded-xl p-5 shadow-md">
      {message && (
        <p className="mb-4 text-center text-sm text-green-600 font-medium">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-sm">
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={form.first_name}
          onChange={handleChange}
          className="col-span-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-600 focus:outline-none"
          required
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={form.last_name}
          onChange={handleChange}
          className="col-span-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-600 focus:outline-none"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email (Optional)"
          value={form.email}
          onChange={handleChange}
          className="col-span-2 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-600 focus:outline-none"
        />
        <input
          type="text"
          name="contact_no"
          placeholder="Contact Number"
          value={form.contact_no}
          onChange={handleChange}
          className="col-span-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-600 focus:outline-none"
          required
        />
        <input
          type="date"
          name="birthdate"
          value={form.birthdate}
          onChange={handleChange}
          className="col-span-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-600 focus:outline-none"
          required
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="col-span-1 px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
        >
          <option value="">Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHERS">Others</option>
        </select>

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="col-span-1 px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
        >
          <option value="RESIDENT">Resident</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>

        <textarea
          name="address"
          placeholder="Complete Address"
          value={form.address}
          onChange={handleChange}
          className="col-span-2 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-600 focus:outline-none resize-none"
        ></textarea>

        {/* Checkboxes */}
        <div className="col-span-2 grid grid-cols-2 gap-1 text-xs text-gray-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_head_of_family" onChange={handleChange} />
            Head of Family
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_4ps_member" onChange={handleChange} />
            4Ps Member
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_pwd" onChange={handleChange} />
            PWD
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_indigenous" onChange={handleChange} />
            Indigenous
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_slp_beneficiary" onChange={handleChange} />
            SLP Beneficiary
          </label>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1">Upload Photo</label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleChange}
            className="w-full px-2 py-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="col-span-2 py-2 mt-2 text-sm font-semibold rounded-md bg-gradient-to-r from-red-700 to-red-500 text-white hover:from-black hover:to-gray-800 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Register
        </button>
      </form>
    </div>
  </div>
</div>
  );
}

