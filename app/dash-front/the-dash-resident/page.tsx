"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface Resident {
  resident_id: number;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
}

interface Announcement {
  announcement_id: number;
  title: string;
  content?: string;
  posted_at: string;
  is_public: boolean;
  expiration_date?: string;
  expiration_days?: number;
}

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className="w-16 h-16 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
  );
};

// Skeleton Loading Cards
const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow p-4 text-center animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
    <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto"></div>
  </div>
);

const SkeletonAnnouncement = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-1/3 mt-3"></div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("the-dash-resident");
  const [resident, setResident] = useState<Resident | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [summary, setSummary] = useState({
    totalCertificates: 0,
    pendingCertificates: 0,
    totalFeedbacks: 0,
    pendingFeedbacks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        router.push("/auth-front/login");
        return;
      }

      const res = await fetch("/api/dash/the-dash-resident", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Please login again.");
          localStorage.removeItem("token");
          router.push("/auth-front/login");
          return;
        }
        throw new Error("Failed to fetch dashboard");
      }
      
      const data = await res.json();
      setResident(data.resident);
      setAnnouncements(data.announcements);
      setSummary(data.summary);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000ms = 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  // Calculate expiry based on expiration_date or posted_at + expiration_days
  const getExpiry = (posted_at: string, expiration_date?: string, expiration_days?: number) => {
    const now = new Date();
    
    // If expiration_date is provided, use it directly
    if (expiration_date) {
      const expiryDate = new Date(expiration_date);
      const diff = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }
    
    // Otherwise calculate from posted_at + expiration_days
    const postedDate = new Date(posted_at);
    const daysPassed = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
    const expiryDays = expiration_days || 14;
    const remaining = expiryDays - daysPassed;
    return remaining > 0 ? remaining : 0;
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
        <div className="p-4 flex items-center justify-center">
          <img
            src="/niugan-logo.png"
            alt="Logo"
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

        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link
                  href={`/dash-front/${name}`}
                  onClick={() => setActiveItem(name)}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name
                      ? "text-red-700 font-semibold"
                      : "text-black hover:text-red-700"
                  }`}
                >
                  {activeItem === name && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-6 h-6 mr-2 ${
                      activeItem === name
                        ? "text-red-700"
                        : "text-gray-600 group-hover:text-red-700"
                    }`}
                  />
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>

        <div className="p-4 flex justify-center hidden md:flex">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center focus:outline-none transition-colors duration-200 shadow-sm"
          >
            {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5 text-black" /> : <ChevronRightIcon className="w-5 h-5 text-black" />}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold">Resident Dashboard</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto text-black">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-medium">Error</p>
              <p>{error}</p>
              <button
                onClick={fetchDashboard}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
              >
                Retry
              </button>
            </div>
          )}

          {loading && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
              <LoadingSpinner size="lg" />
              <p className="text-gray-200 text-lg mt-3">Loading dashboard...</p>
            </div>
          )}

          <div className={`${loading ? "opacity-40 pointer-events-none" : ""}`}>
            {loading ? (
              <>
                {/* Skeleton Resident Info */}
                <div className="flex items-center gap-4 mb-6 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-gray-300"></div>
                  <div className="h-8 bg-gray-300 rounded w-64"></div>
                </div>

                {/* Skeleton Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>

                {/* Skeleton Announcements */}
                <div className="space-y-6 w-full">
                  <SkeletonAnnouncement />
                  <SkeletonAnnouncement />
                  <SkeletonAnnouncement />
                </div>
              </>
            ) : (
              <>
               {/* Resident Info */}
              {resident && (
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={resident.photo_url || "/default-profile.png"}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/default-profile.png";
                    }}
                  />
                  <h1 className="text-3xl font-semibold">
                    Welcome, {resident.first_name} {resident.last_name}!
                  </h1>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition">
                  <p className="text-black">Total Certificates</p>
                  <p className="text-3xl font-bold text-red-700">{summary.totalCertificates}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition">
                  <p className="text-black">Pending Certificates</p>
                  <p className="text-3xl font-bold text-red-700">{summary.pendingCertificates}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition">
                  <p className="text-black">Total Complaint</p>
                  <p className="text-3xl font-bold text-red-700">{summary.totalFeedbacks}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition">
                  <p className="text-black">Pending Complaint</p>
                  <p className="text-3xl font-bold text-red-700">{summary.pendingFeedbacks}</p>
                </div>
              </div>
              </>
            )}
          </div>

              {/* Announcements - Enhanced Display (Admin Style) */}
              <section>
                <header className="mb-6">
                  <h3 className="text-xl font-semibold">Announcements</h3>
                </header>
                {announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No announcements yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((ann) => {
                      const daysLeft = getExpiry(ann.posted_at, ann.expiration_date, ann.expiration_days);
                      return (
                        <div key={ann.announcement_id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                            <div>
                              <h3 className="text-xl font-semibold mb-2">{ann.title}</h3>
                              <p className="text-sm text-gray-600">
                                Posted on {new Date(ann.posted_at).toLocaleDateString()} • {ann.is_public ? "Public" : "Private"}
                                {ann.expiration_date && (
                                  <span> • Expires: {new Date(ann.expiration_date).toLocaleDateString()}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <p className="text-black mb-3">{ann.content ?? "No content provided."}</p>

                          <div className="flex items-center justify-between text-sm">
                            <p className="text-gray-400">
                              Posted at: {new Date(ann.posted_at).toLocaleString()}
                            </p>
                            <p className={`font-medium ${daysLeft <= 3 ? "text-red-600" : "text-green-600"}`}>
                              Expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
        </main>
        </div> 
        </div> 
        ); 
        }