"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  address?: string;
  id_number: string;
  photo_url?: string | null;
  birthdate?: string;
  issued_at?: string | null;
  issued_by?: string | null;
  qr_code?: string | null;
  memberships?: string[];
  is_renter?: boolean;
  landlord_name?: string | null;
}

export default function DigitalID() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resident, setResident] = useState<Resident | null>(null);
  const [loadingResident, setLoadingResident] = useState(true);
  const [errorResident, setErrorResident] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchDigitalID = async () => {
      setLoadingResident(true);
      setErrorResident(null);
      try {
        const token = getToken();
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await axios.get("/api/dash/digital-id", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { resident, digitalID, household_head } = res.data;
        if (!resident || !digitalID) {
          setErrorResident("Invalid digital ID data received.");
          return;
        }

        setResident({
          resident_id: resident.resident_id,
          first_name: resident.first_name,
          last_name: resident.last_name,
          address: resident.address,
          photo_url: resident.photo_url,
          birthdate: resident.birthdate,
          id_number: digitalID.id_number,
          issued_at: digitalID.issued_at?.split("T")[0] || "N/A",
          issued_by: digitalID.issued_by?.toString() || "N/A",
          qr_code: digitalID.qr_code || null,
          memberships: resident.memberships || [],
          is_renter: resident.is_renter || false,
          landlord_name: household_head || "N/A",
        });
      } catch (err: any) {
        const status = err?.response?.status;
        const apiMsg = err?.response?.data?.error || err?.response?.data?.message;

        if (status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        if (status === 404) {
          setErrorResident(
            "Digital ID not found. Please ensure your profile has been approved by the barangay administrator."
          );
          return;
        }
        setErrorResident(apiMsg || "Failed to fetch digital ID");
      } finally {
        setLoadingResident(false);
      }
    };

    fetchDigitalID();
  }, []);

  const handleDownload = async () => {
  if (!cardRef.current || !resident) return;

  const card = cardRef.current;

  // Wait for all images inside the card to load (profile + QR)
  const images = card.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if ((img as HTMLImageElement).complete) resolve();
          else {
            img.addEventListener("load", () => resolve());
            img.addEventListener("error", () => resolve());
          }
        })
    )
  );

  try {
    const dataUrl = await toPng(card, { cacheBust: true, backgroundColor: "white" });

    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${resident.first_name}-${resident.last_name}-DigitalID.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};


  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth-front/login");
  };

  if (loadingResident)
    return <p className="text-center mt-20">Loading digital ID...</p>;
  if (errorResident)
    return (
      <div className="text-center mt-20 text-red-500">
        <p>{errorResident}</p>
        <p className="mt-4">
          Please go to{" "}
          <Link href="/dash-front/resident" className="text-blue-600 underline">
            Manage Profile
          </Link>{" "}
          to verify your information.
        </p>
      </div>
    );

  if (!resident)
    return <p className="text-center mt-20 text-red-500">Digital ID not found</p>;

  const features = [
    { name: "the-dash-resident", label: "Home", icon: HomeIcon },
    { name: "resident", label: "Manage Profile", icon: UserIcon },
    { name: "digital-id", label: "Digital ID", icon: CreditCardIcon },
    { name: "certificate-request", label: "Certificates", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Complaint", icon: ChatBubbleLeftEllipsisIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col 
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : "hidden md:flex"}`}
      >
        {/* Logo + Close */}
        <div className="p-4 flex items-center justify-center">
          <img
            src="/niugan-logo.png"
            alt="Company Logo"
            className={`rounded-full object-cover transition-all duration-300 ${
              sidebarOpen ? "w-30 h-30" : "w-8.5 h-8.5"
            }`}
          />
          <button
            onClick={toggleSidebar}
            className="absolute top-3 right-3 text-black hover:text-red-700 focus:outline-none md:hidden"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => {
              const href = `/dash-front/${name}`;
              const isActive = name === "digital-id";
              return (
                <li key={name} className="mb-2">
                  <Link href={href}>
                    <span
                      className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                        isActive
                          ? "text-red-700 font-semibold"
                          : "text-black hover:text-red-700"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />
                      )}
                      <Icon
                        className={`w-6 h-6 mr-2 ${
                          isActive ? "text-red-700" : "text-gray-600 group-hover:text-red-700"
                        }`}
                      />
                      {sidebarOpen && (
                        <span className={`${isActive ? "text-red-700" : "group-hover:text-red-700"}`}>
                          {label}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>

        {/* Sidebar Toggle (desktop only) */}
        <div className="p-4 flex justify-center hidden md:flex">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center focus:outline-none transition-colors duration-200 shadow-sm"
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5 text-black" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold">Barangay Digital ID</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        {/* ID Card */}
        <main className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4 sm:p-6 md:p-8 shadow-md">
          <div
            ref={cardRef}
            className="relative w-full max-w-[550px] aspect-[11/6] bg-white rounded-xl shadow-md border border-gray-700 overflow-hidden text-black"
          >
            {/* Left stripe */}
            <div className="absolute left-0 top-0 h-full w-2 sm:w-4 md:w-[15px] bg-gradient-to-b from-red-700 via-white to-blue-700" />

            <div className="flex h-full p-2 pl-4 sm:p-4 sm:pl-6 md:p-6 md:pl-10">
              <div className="flex flex-col justify-between">
                <img
                  src={resident.photo_url || "/default-profile.png"}
                  alt="Profile"
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-md border border-gray-700 object-cover"
                  loading="lazy"
                />
                <div className="text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">
                  <p>Issued: {resident.issued_at || "N/A"}</p>
                  <p>Issued by: {resident.issued_by || "N/A"}</p>
                </div>
              </div>

              <div className="flex-1 pl-2 sm:pl-4 md:pl-6 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-700">REPUBLIC OF THE PHILIPPINES</p>
                  <h2 className="text-[10px] sm:text-xs md:text-sm font-bold leading-tight">BARANGAY DIGITAL ID</h2>
                  <div className="flex justify-between">
                    <p className="text-[10px] sm:text-xs md:text-sm font-semibold mt-1">ID No.</p>
                    <p className="text-[10px] sm:text-xs md:text-sm mt-1">{resident.id_number}</p>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm font-semibold mt-1 sm:mt-2 md:mt-4">
                    {resident.first_name} {resident.last_name}
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-700">{resident.address}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-700">
                    Household Head: {resident.landlord_name || "N/A"}
                  </p>

                  {resident.memberships?.length ? (
                    <div className="text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">
                      <p className="font-semibold">Memberships:</p>
                      <ul className="list-disc list-inside">
                        {resident.memberships.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="absolute bottom-8 right-4">
                  {resident.qr_code ? (
                    <img
                      src={resident.qr_code}
                      alt="QR Code"
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-[90px] md:h-[90px] object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-700">QR not available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
