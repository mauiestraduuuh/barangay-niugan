"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  address: string;
  head_id?: bigint | null;
  household_id?: bigint | null;
  photo_url?: string | null;
  is_4ps_member: boolean;
  is_pwd: boolean;
  senior_mode: boolean;
  is_slp_beneficiary: boolean;
}

interface DigitalID {
  id_number: string;
  issued_at: string;
  issued_by: number;
}

export default function DigitalIDPage() {
  const [resident, setResident] = useState<Resident | null>(null);
  const [digitalID, setDigitalID] = useState<DigitalID | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    axios
      .get("/api/dash/digital-id", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setResident(res.data.resident);
        setDigitalID(res.data.digitalID);
      })
      .catch((err) => console.error(err));
  }, [token]);

  if (!resident || !digitalID)
    return <p className="text-white text-center mt-10">Loading Digital ID...</p>;

  // Convert BigInt fields to string for JSON
  const qrContent: Record<string, string> = {
    "First Name": resident.first_name,
    "Last Name": resident.last_name,
    "Birthdate": new Date(resident.birthdate).toLocaleDateString(),
    "Address": resident.address,
  };

  if (resident.head_id) qrContent["Head ID"] = resident.head_id.toString();
  if (resident.household_id) qrContent["Household ID"] = resident.household_id.toString();
  if (resident.is_4ps_member) qrContent["Member of 4PS"] = "Yes";
  if (resident.is_pwd) qrContent["PWD"] = "Yes";
  if (resident.senior_mode) qrContent["Senior"] = "Yes";
  if (resident.is_slp_beneficiary) qrContent["SLP Beneficiary"] = "Yes";

  const qrString = JSON.stringify(qrContent);

  const defaultIcon = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[linear-gradient(90deg,rgba(2,0,36,1)_0%,rgba(156,11,11,1)_43%,rgba(255,255,255,1)_100%)] p-6">
      <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-center mb-4">
          <img
            src={resident.photo_url || defaultIcon}
            alt="Profile"
            className="w-24 h-24 rounded-full border-2 border-black"
          />
        </div>

        <div className="text-center text-black space-y-1">
          <h2 className="text-2xl font-bold">
            {resident.first_name} {resident.last_name}
          </h2>
          <p className="font-semibold">ID: ID-{resident.resident_id}</p>
          <p>Issued: {new Date(digitalID.issued_at).toLocaleDateString()}</p>
          <p>Issued by staff ID: {digitalID.issued_by}</p>
        </div>

        {/* QR Code (contains all details) */}
        <div className="flex justify-center mt-4">
          <QRCode value={qrString} size={150} bgColor="#fff" fgColor="#000" />
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
          >
            Print ID
          </button>
        </div>
      </div>
    </div>
  );
}
