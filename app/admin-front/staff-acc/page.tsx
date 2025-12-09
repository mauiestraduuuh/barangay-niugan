"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  UsersIcon,
  ClipboardDocumentIcon,
  MegaphoneIcon,
  KeyIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftEllipsisIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";



// Notification interface
interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Staff interface matching your Prisma model (dates as strings from backend)
interface Staff {
  staff_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  birthdate: string; // ISO string
  gender?: string | null;
  address?: string | null;
  contact_no?: string | null;
  photo_url?: string | null;
  senior_mode: boolean;
  is_head_of_family: boolean;
  head_id?: string | null; // serialized BigInt as string
  household_number?: string | null;
  is_4ps_member: boolean;
  is_indigenous: boolean;
  is_slp_beneficiary: boolean;
  is_pwd: boolean;
  household_id?: number | null;
  created_at: string; // ISO
  updated_at: string; // ISO
  user: {
    user_id?: number;
    role?: string;
    email?: string;
  };
  performance: {
    certificatesProcessed: number;
    registrationResolved: number;
    performanceScore: number;
  };
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

// Full Page Loading Overlay
const LoadingOverlay = ({ message = "Processing..." }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl flex flex-col items-center gap-4 shadow-2xl">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default function StaffAccounts() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("staff-acc");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Complaint", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff-acc", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



const fetchStaff = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token"); // Make sure token is saved on login
    const res = await fetch("/api/admin/staff", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error || "Failed to fetch staff");
    }

    const data: Staff[] = await res.json();
    setStaffList(data);
  } catch (error: any) {
    console.error("Fetch staff failed:", error);
    alert(error.message);
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async () => {
    if (!selectedStaff) return;

    try {
      const res = await fetch("/api/admin/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: selectedStaff.staff_id }),
      });

      if (res.ok) {
        setStaffList((prev) => prev.filter((s) => s.staff_id !== selectedStaff.staff_id));
        setShowDeleteModal(false);
        setSelectedStaff(null);
      } else {
        const err = await res.json();
        alert(err?.error || "Failed to delete staff.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed. Check console.");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

 const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  // utility to format ISO date -> readable
  const formatDate = (iso?: string | null) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  //Pagination Logic
  const filteredStaff = staffList.filter((s) =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [ITEMS_PER_PAGE, setITEMS_PER_PAGE] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page if search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); 
    
    return () => clearInterval(interval);
  }, []);

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
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link
                  href={`/admin-front/${name}`}
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
                  {sidebarOpen && (
                    <span
                      className={`${
                        activeItem === name
                          ? "text-red-700"
                          : "group-hover:text-red-700"
                      }`}
                    >
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

      {/* Functional Logout Button */}
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
        <div
          className="fixed inset-0 bg-white/80 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col gap-4 w-full overflow-hidden text-black">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold">Staff Management</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        

         <main className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-sm overflow-auto">
          <input
          type="text"
          placeholder="Search by name..."
          className="px-3 py-2 border border-gray-300 rounded mb-4 w-full text-black"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading Staff Information...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
            <table className="min-w-full border-collapse text-left bg-white shadow-sm rounded-xl overflow-hidden text-sm sm:text-base">
              <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white rounded-xl">
                <tr className="border-b border-gray-300">
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Performance</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList
                  .filter((s) =>
                    `${s.first_name} ${s.last_name}`
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .map((staff) => (
                  <tr key={staff.staff_id} className="hover:bg-gray-100 transition">
                    <td className="py-3 px-4">{staff.staff_id}</td>
                    <td className="py-3 px-4 capitalize">{staff.first_name} {staff.last_name}</td>
                    <td className="py-3 px-4">{staff.user?.role ?? "N/A"}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      Certificates: <b>{staff.performance?.certificatesProcessed ?? 0}</b> | Registration: <b>{staff.performance?.registrationResolved ?? 0}</b> | Total: <b>{staff.performance?.performanceScore ?? 0}</b>
                    </td>
                    <td className="py-3 px-4 text-center flex justify-center gap-3">
                      <button
                        onClick={() => { setSelectedStaff(staff); setShowViewModal(true); }}
                        className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm"
                      >
                        View
                      </button>

                      <button
                        onClick={() => { setSelectedStaff(staff); setShowDeleteModal(true); }}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <TrashIcon className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-600">No staff found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}
          
        {/*Pagination Controls */}
        <div className="w-full mt-5 flex justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5">

            {/* Prev */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              ‹
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;

              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-red-100 text-red-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              }

              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <div key={i} className="px-1 text-gray-400">
                    ...
                  </div>
                );
              }

              return null;
            })}

            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-3xl text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              ›
            </button>

            {/* Items per page */}
            <select
              value={ITEMS_PER_PAGE}
              onChange={(e) => {
                setCurrentPage(1);
                setITEMS_PER_PAGE(Number(e.target.value));
              }}
              className="ml-3 bg-white border border-gray-300 text-sm rounded-xl px-3 py-1"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>

          </div>
        </div>
        </main>

        

        {/* View Modal */}
        {showViewModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl">
              <div className="flex items-start gap-6">
                {selectedStaff.photo_url ? (
                  <img src={selectedStaff.photo_url} alt="Staff photo" className="w-28 h-28 object-cover rounded-lg border" />
                ) : (
                  <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center">No Photo</div>
                )}

                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1 capitalize">{selectedStaff.first_name} {selectedStaff.last_name}</h2>
                  <p className="text-sm text-gray-600 mb-3">{selectedStaff.user?.role ?? "Role: N/A"}</p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="font-semibold">Staff ID:</span> {selectedStaff.staff_id}</div>
                    <div><span className="font-semibold">User ID:</span> {selectedStaff.user_id}</div>

                    <div><span className="font-semibold">Birthdate:</span> {formatDate(selectedStaff.birthdate)}</div>
                    <div><span className="font-semibold">Gender:</span> {selectedStaff.gender ?? "N/A"}</div>

                    <div><span className="font-semibold">Contact:</span> {selectedStaff.contact_no ?? "N/A"}</div>
                    <div><span className="font-semibold">Address:</span> {selectedStaff.address ?? "N/A"}</div>

                    <div><span className="font-semibold">Household #:</span> {selectedStaff.household_number ?? "N/A"}</div>
                    <div><span className="font-semibold">Household ID:</span> {selectedStaff.household_id ?? "N/A"}</div>

                    <div><span className="font-semibold">Head of Family:</span> {selectedStaff.is_head_of_family ? "Yes" : "No"}</div>
                    <div><span className="font-semibold">Head ID:</span> {selectedStaff.head_id ?? "N/A"}</div>

                    <div><span className="font-semibold">Senior Mode:</span> {selectedStaff.senior_mode ? "Yes" : "No"}</div>
                    <div><span className="font-semibold">4Ps Member:</span> {selectedStaff.is_4ps_member ? "Yes" : "No"}</div>

                    <div><span className="font-semibold">Indigenous:</span> {selectedStaff.is_indigenous ? "Yes" : "No"}</div>
                    <div><span className="font-semibold">SLP Beneficiary:</span> {selectedStaff.is_slp_beneficiary ? "Yes" : "No"}</div>

                    <div><span className="font-semibold">PWD:</span> {selectedStaff.is_pwd ? "Yes" : "No"}</div>
                    <div><span className="font-semibold">Email:</span> {selectedStaff.user?.email ?? "N/A"}</div>

                    <div><span className="font-semibold">Created At:</span> {formatDate(selectedStaff.created_at)}</div>
                    <div><span className="font-semibold">Updated At:</span> {formatDate(selectedStaff.updated_at)}</div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold">Performance</h3>
                    <p className="text-sm">Certificates Processed: <b>{selectedStaff.performance?.certificatesProcessed ?? 0}</b></p>
                    <p className="text-sm">Registration Processed: <b>{selectedStaff.performance?.registrationResolved ?? 0}</b></p>
                    <p className="text-sm">Total Score: <b>{selectedStaff.performance?.performanceScore ?? 0}</b></p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { setShowViewModal(false); setSelectedStaff(null); }} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-2">Confirm Deletion</h2>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-semibold capitalize">{selectedStaff.first_name} {selectedStaff.last_name}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
                  Cancel
                </button>
                <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
