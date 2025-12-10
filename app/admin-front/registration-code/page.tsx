"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  KeyIcon,
  BellIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XCircleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

interface RegistrationCode {
  id: number;
  code: string;
  ownerName: string;
  isUsed: boolean;
  usedById?: number | null;
}

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-red-700 border-t-transparent rounded-full animate-spin`}
    ></div>
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

// Confirmation Modal
const ConfirmationModal = ({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <p className="mb-4 text-gray-700">{message}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-700 text-white hover:bg-red-800"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// Error Modal
const ErrorModal = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
      <h2 className="text-lg font-bold mb-2 text-red-700">Error</h2>
      <p className="mb-4 text-gray-700">{message}</p>
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-xl bg-red-700 text-white hover:bg-red-800"
      >
        Close
      </button>
    </div>
  </div>
);

// Success Modal
const SuccessModal = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
      <h2 className="text-lg font-bold mb-2 text-green-700">Success</h2>
      <p className="mb-4 text-gray-700">{message}</p>
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-xl bg-green-700 text-white hover:bg-green-800"
      >
        Close
      </button>
    </div>
  </div>
);

export default function StaffRegistrationCodePage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [filter, setFilter] = useState<"used" | "unused">("unused");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState<() => void>(() => {});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const filteredCodes = codes.filter((c) =>
    filter === "unused" ? !c.isUsed : c.isUsed
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredCodes.slice(indexOfFirst, indexOfLast);

  // Fetch all registration codes
  const fetchCodes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/registration-code", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setCodes(res.data.codes);
      else handleError(res.data.message || "Failed to fetch codes");
    } catch (err) {
      console.error(err);
      handleError("Failed to fetch codes");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const handleError = (msg: string) => {
    setErrorMessage(msg);
    setShowError(true);
  };

  const handleSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
  };

  // Generate a new code
  const generateCode = () => {
    if (!ownerName.trim()) {
      handleError("Owner name is required");
      return;
    }
    setConfirmCallback(() => async () => {
      setActionLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "/api/admin/registration-code",
          { ownerName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          handleSuccess("Code generated successfully!");
          setOwnerName("");
          fetchCodes();
        } else handleError(res.data.message);
      } catch (err) {
        console.error(err);
        handleError("Failed to create code");
      } finally {
        setActionLoading(false);
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  // Delete unused code
  const deleteCode = (id: number) => {
    setConfirmCallback(() => async () => {
      setActionLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.delete("/api/admin/registration-code", {
          data: { id },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          handleSuccess("Code deleted successfully!");
          fetchCodes();
        } else handleError(res.data.message);
      } catch (err) {
        console.error(err);
        handleError("Failed to delete code");
      } finally {
        setActionLoading(false);
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

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

 const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "block" : "hidden"
        } md:block md:relative md:translate-x-0 ${
          sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0" : ""
        }`}
      >
        {/* Logo + Close */}
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

        {/* Navigation */}
        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => {
              const href = `/admin-front/${name}`;
              const isActive = name === "registration-code";
              return (
                <li key={name} className="mb-2">
                  <Link href={href}>
                    <span
                      className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                        isActive ? "text-red-700" : "text-black hover:text-red-700"
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

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>

        {/* Sidebar Toggle */}
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

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>}

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-large font-bold ">Registration Code</h1>
          <div className="flex items-center space-x-4"></div>
        </header>

        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm overflow-auto">
          <h3 className="text-large font-semibold mb-4 text-black">Registration History</h3>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Owner name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="border rounded px-3 py-2 flex-1 text-black"
            />
            <button
              onClick={generateCode}
              disabled={actionLoading}
              className="bg-black text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="leading-none">Generating...</span>
                </>
              ) : (
                <span className="leading-none">Generate</span>
              )}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-black font-medium">Show:</span>
              <button
                onClick={() => setFilter("unused")}
                className={`px-3 py-1 rounded ${
                  filter === "unused" ? "bg-red-700 text-white" : "bg-gray-200 text-black"
                }`}
              >
                Unused
              </button>
              <button
                onClick={() => setFilter("used")}
                className={`px-3 py-1 rounded ${
                  filter === "used" ? "bg-red-700 text-white" : "bg-gray-200 text-black"
                }`}
              >
                Used
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading Registration Code...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse bg-white shadow-sm rounded-xl overflow-hidden text-sm sm:text-base">
                <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Owner</th>
                  <th className="px-4 py-2 text-center">Status</th>

                  {/* Only show Actions column for UNUSED */}
                  {filter === "unused" && (
                    <th className="px-4 py-2 text-center">Actions</th>
                  )}
                </tr>
              </thead>

                <tbody>
                  {currentItems.map((c, index) => (
                    <tr
                      key={c.id}
                      className={`border-t hover:bg-red-50 transition ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-2 font-medium text-black">{c.code}</td>
                      <td className="px-4 py-2 text-black">{c.ownerName}</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                            c.isUsed ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"
                          }`}
                        >
                          {c.isUsed ? "USED" : "UNUSED"}
                        </span>
                      </td>
                      {filter === "unused" && (
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => deleteCode(c.id)}
                            disabled={actionLoading}
                            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="w-full mt-4 flex justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 ">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-3xl text-gray-600 hover:text-black disabled:opacity-30 leading-none"
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                            currentPage === page ? "bg-red-200 text-red-800" : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) return <span key={i} className="px-1 text-gray-400">...</span>;
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-3xl text-gray-600 hover:text-black disabled:opacity-30 leading-none"
                  >
                    ›
                  </button>

                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-2 bg-white border border-gray-300 text-sm rounded-lg px-2 py-1"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>
            </div>

            
          )}
        </main>
      </div>
      {showConfirm && (
        <ConfirmationModal
          title="Generate Code?"
          message="Are you sure you want to generate a new registration code?"
          onConfirm={confirmCallback}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showError && (
        <ErrorModal
          message={errorMessage}
          onClose={() => setShowError(false)}
        />
      )}

      {showSuccess && (
        <SuccessModal
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      )}

      {actionLoading && <LoadingOverlay message="Processing..." />}

    </div>
  );
}
