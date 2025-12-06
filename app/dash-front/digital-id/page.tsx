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

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className={`${sizeClasses[size]} border-red-700 border-t-transparent rounded-full animate-spin`}></div>
  );
};

// Skeleton ID Card
const SkeletonIDCard = () => (
  <div className="relative w-full max-w-[550px] aspect-[11/6] bg-white rounded-xl shadow-md border border-gray-700 overflow-hidden animate-pulse">
    {/* Left stripe */}
    <div className="absolute left-0 top-0 h-full w-2 sm:w-4 md:w-[15px] bg-gradient-to-b from-red-700 via-white to-blue-700" />

    <div className="flex h-full p-2 pl-4 sm:p-4 sm:pl-6 md:p-6 md:pl-10">
      <div className="flex flex-col justify-between">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-md bg-gray-300" />
        <div className="space-y-2 mt-1 sm:mt-2">
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-28"></div>
        </div>
      </div>

      <div className="flex-1 pl-2 sm:pl-4 md:pl-6 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mt-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>

        <div className="absolute bottom-8 right-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-[90px] md:h-[90px] bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function DigitalID() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resident, setResident] = useState<Resident | null>(null);
  const [loadingResident, setLoadingResident] = useState(true);
  const [errorResident, setErrorResident] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  const waitForImages = async (container: HTMLElement) => {
  const images = container.querySelectorAll("img");
  const imagePromises = Array.from(images).map(async (img) => {
    const imageEl = img as HTMLImageElement;
    
    // If image is already complete and has dimensions, it's ready
    if (imageEl.complete && imageEl.naturalHeight !== 0) {
      try {
        await imageEl.decode();
      } catch (e) {
        console.warn("Image decode failed:", e);
      }
      return;
    }
    
    // Wait for the image to load
    return new Promise<void>((resolve) => {
      const onLoad = async () => {
        try {
          await imageEl.decode();
        } catch (e) {
          console.warn("Image decode failed:", e);
        }
        resolve();
      };
      
      const onError = () => {
        console.warn("Image failed to load:", imageEl.src);
        resolve(); // Resolve anyway to not block the download
      };
      
      imageEl.addEventListener("load", onLoad, { once: true });
      imageEl.addEventListener("error", onError, { once: true });
      
      // If the image is already loaded while we were setting up listeners
      if (imageEl.complete) {
        imageEl.removeEventListener("load", onLoad);
        imageEl.removeEventListener("error", onError);
        onLoad();
      }
    });
  });
  
  await Promise.all(imagePromises);
};

// Preload images when resident data loads
useEffect(() => {
  if (resident?.photo_url || resident?.qr_code) {
    const preloadImages = async () => {
      const imagesToPreload = [
        resident.photo_url,
        resident.qr_code
      ].filter(Boolean);

      const promises = imagesToPreload.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // Resolve even on error
          img.src = src!;
        });
      });

      await Promise.all(promises);
      console.log("Images preloaded successfully");
    };

    preloadImages();
  }
}, [resident]);

const handleDownload = async () => {
  if (!cardRef.current || !resident) return;

  setDownloading(true);
  const card = cardRef.current;

  try {
    // Wait for all images to fully load & decode
    await waitForImages(card);
    
    // Additional delay to ensure rendering is complete
    await new Promise((res) => setTimeout(res, 500));

    // Generate PNG with higher quality settings
    const dataUrl = await toPng(card, { 
      cacheBust: true, 
      backgroundColor: "white",
      pixelRatio: 2, // Higher quality
      skipFonts: false // Ensure fonts are rendered
    });
    
    // Create PDF
    const pdf = new jsPDF({ 
      orientation: "landscape", 
      unit: "px", 
      format: "a4" 
    });
    
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${resident.first_name}-${resident.last_name}-DigitalID.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to download PDF. Please try again.");
  } finally {
    setDownloading(false);
  }
};
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const retryLoad = () => {
    window.location.reload();
  };

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

        {/* Main Content */}
        <main className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4 sm:p-6 md:p-8 shadow-md flex-1">
          {/* Error State */}
          {errorResident && (
            <div className="w-full max-w-2xl">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">Error</p>
                <p>{errorResident}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={retryLoad}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
                  >
                    Retry
                  </button>
                  <Link
                    href="/dash-front/resident"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition inline-block"
                  >
                    Go to Manage Profile
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingResident && !errorResident && (
            <div className="flex flex-col items-center gap-6">
              <LoadingSpinner size="lg" />
              <p className="text-black text-lg">Loading digital ID...</p>
              <SkeletonIDCard />
            </div>
          )}

          {/* Loaded ID Card */}
          {!loadingResident && !errorResident && resident && (
            <>
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
                  disabled={downloading}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )};