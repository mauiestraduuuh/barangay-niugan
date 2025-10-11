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
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement;
  const { name, value } = target;

  // Explicitly check for input type
  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    setForm((prev) => ({ ...prev, [name]: target.checked }));
  } else {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-[400px]"
      >
        <h1 className="text-2xl font-semibold text-center mb-4">
          Resident Registration
        </h1>

        <div className="grid gap-3">
          <input
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            name="email"
            placeholder="Email (optional)"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="contact_no"
            placeholder="Contact Number"
            value={form.contact_no}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="date"
            name="birthdate"
            value={form.birthdate}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHERS">Others</option>
          </select>
          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <div className="flex flex-col gap-1 text-sm">
            <label>
              <input
                type="checkbox"
                name="is_head_of_family"
                checked={form.is_head_of_family}
                onChange={handleChange}
              />{" "}
              Head of Family
            </label>
            <label>
              <input
                type="checkbox"
                name="is_4ps_member"
                checked={form.is_4ps_member}
                onChange={handleChange}
              />{" "}
              4Ps Member
            </label>
            <label>
              <input
                type="checkbox"
                name="is_pwd"
                checked={form.is_pwd}
                onChange={handleChange}
              />{" "}
              PWD
            </label>
            <label>
              <input
                type="checkbox"
                name="is_indigenous"
                checked={form.is_indigenous}
                onChange={handleChange}
              />{" "}
              Indigenous
            </label>
            <label>
              <input
                type="checkbox"
                name="is_slp_beneficiary"
                checked={form.is_slp_beneficiary}
                onChange={handleChange}
              />{" "}
              SLP Beneficiary
            </label>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Submit Registration
          </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </form>
    </div>
  );
}
