"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  Bars3Icon,
  ChevronLeftIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
} from "@heroicons/react/24/outline";

interface Admin {
  id: number;
  name: string;
  photo_url?: string | null;
  role: string;
}

interface Overview {
  totalResidents: number;
  totalCertificates: number;
  totalFeedback: number;
  totalStaff: number;
  totalAnnouncements: number;
}

interface UrgentItem {
  id: number;
  type: 'certificate' | 'feedback' | 'registration';
  title: string;
  resident_name: string;
  days_waiting: number;
  priority: 'high' | 'medium' | 'low';
  link: string;
}

interface StaffPerformance {
  staff_id: number;
  name: string;
  completed_today: number;
  completed_this_week: number;
  pending_assigned: number;
  avg_completion_time: number;
}

interface SystemAlert {
  id: number;
  type: 'warning' | 'error' | 'info';
  message: string;
  count?: number;
  action_link?: string;
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

// Loading Modal Component
const LoadingModal = ({ message }: { message: string }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700 font-medium text-center text-sm sm:text-base">{message}</p>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter(); 
  const [activeItem, setActiveItem] = useState("the-dash-admin");
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [urgentItems, setUrgentItems] = useState<UrgentItem[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [navigationMessage, setNavigationMessage] = useState("");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage");
        return;
      }
      const res = await fetch("/api/admin/the-dash-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("API Error:", data);
        throw new Error(data.message || "Failed to fetch admin dashboard");
      }
      setAdmin(data.admin);
      setOverview(data.overview);
      
      setUrgentItems(data.urgentItems || []);
      setStaffPerformance(data.staffPerformance || []);
      setSystemAlerts(data.systemAlerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation with loading modal
  const handleNavigation = (path: string, message: string) => {
    setNavigating(true);
    setNavigationMessage(message);
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
    router.push(path);
  };

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;
      case 'warning': return <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;
      default: return <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-2 sm:p-4 flex flex-col md:flex-row gap-2 sm:gap-4">
      {/* Loading Modal */}
      {navigating && <LoadingModal message={navigationMessage} />}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col 
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 m-2 sm:m-0" : "hidden md:flex"}`}
      >
        <div className="p-4 flex items-center justify-center relative">
          <img
            src="/niugan-logo.png"
            alt="Company Logo"
            className={`rounded-full object-cover transition-all duration-300 ${
              sidebarOpen ? "w-20 h-20 sm:w-24 sm:h-24" : "w-8 h-8"
            }`}
          />
          <button
            onClick={toggleSidebar}
            className="absolute top-3 right-3 text-black hover:text-red-700 focus:outline-none md:hidden"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto">
          <ul>
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link
                  href={`/admin-front/${name}`}
                  onClick={() => {
                    setActiveItem(name);
                    setSidebarOpen(false); // Close sidebar on mobile
                  }}
                  className={`relative flex items-center w-full px-4 py-3 text-left group transition-colors duration-200 ${
                    activeItem === name
                      ? "text-red-700 font-semibold"
                      : "text-black hover:text-red-700"
                  }`}
                >
                  {activeItem === name && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 mr-3 flex-shrink-0 ${
                      activeItem === name
                        ? "text-red-700"
                        : "text-gray-600 group-hover:text-red-700"
                    }`}
                  />
                  {sidebarOpen && (
                    <span
                      className={`text-sm sm:text-base ${
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

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left py-2"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm sm:text-base">Log Out</span>}
          </button>
        </div>

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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-2 sm:gap-4 overflow-y-auto min-w-0">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-3 sm:p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none mr-2 p-1"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-black truncate">Admin Dashboard</h1>
          <div className="w-6 md:w-auto"></div> {/* Spacer for centering */}
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 shadow-sm overflow-auto text-black min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600 text-sm">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {admin && (
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold">{`Welcome back, ${admin.name}!`}</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )}

              {/* System Alerts - ACTIONABLE */}
              {systemAlerts.length > 0 && (
                <section className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FireIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold text-red-700">Urgent Attention Needed</h2>
                  </div>
                  <div className="space-y-2">
                    {systemAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex flex-col sm:flex-row items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border ${
                          alert.type === 'error' ? 'bg-red-50 border-red-200' :
                          alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{alert.message}</p>
                            {alert.count && (
                              <p className="text-xs text-gray-600 mt-1">Count: {alert.count}</p>
                            )}
                          </div>
                        </div>
                        {alert.action_link && (
                          <button
                            onClick={() => handleNavigation(alert.action_link!, "Loading...")}
                            className="text-xs sm:text-sm font-medium text-red-700 hover:text-red-800 whitespace-nowrap ml-auto sm:ml-0"
                          >
                            View →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Overview Cards - Quick Glance */}
              {overview && (
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: "Total Residents", value: overview.totalResidents, icon: UsersIcon },
                    { label: "Certificates", value: overview.totalCertificates, icon: ClipboardDocumentIcon },
                    { label: "Feedback", value: overview.totalFeedback, icon: ChatBubbleLeftEllipsisIcon },
                    { label: "Staff", value: overview.totalStaff, icon: UserIcon },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6 hover:shadow-lg transition"
                    >
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      </div>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-700">{item.value}</p>
                      <h3 className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{item.label}</h3>
                    </div>
                  ))}
                </section>
              )}

              {/* Urgent Items - DO THIS NOW */}
              <section className="mb-4 sm:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">Items Requiring Immediate Action</h2>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  {urgentItems.length === 0 ? (
                    <div className="p-6 text-center">
                      <CheckCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">All caught up! No urgent items.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-3 sm:px-0">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase">Priority</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase hidden sm:table-cell">Resident</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase">Request</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase">Waiting</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {urgentItems.slice(0, 10).map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full border ${getPriorityColor(item.priority)}`}>
                                    {item.priority.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 capitalize">{item.type}</td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 hidden sm:table-cell">{item.resident_name}</td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 max-w-[150px] truncate">{item.title}</td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${item.days_waiting > 7 ? 'text-red-600' : item.days_waiting > 3 ? 'text-yellow-600' : 'text-gray-600'}`}>
                                    {item.days_waiting}d
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  <button
                                    onClick={() => handleNavigation(item.link, "Loading request...")}
                                    className="text-xs sm:text-sm font-medium text-red-700 hover:text-red-800 whitespace-nowrap"
                                  >
                                    Review →
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Staff Performance - WHO'S DOING WHAT */}
              <section className="mb-4 sm:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">Staff Performance Today</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {staffPerformance.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-6 text-sm">No staff data available.</p>
                  ) : (
                    staffPerformance.slice(0, 6).map((staff) => (
                      <div key={staff.staff_id} className="bg-white rounded-xl shadow-md p-3 sm:p-4 hover:shadow-lg transition">
                        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base truncate">{staff.name}</h3>
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-600">Completed Today:</span>
                            <span className="text-base sm:text-lg font-bold text-green-600">{staff.completed_today}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-600">This Week:</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-900">{staff.completed_this_week}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-600">Pending:</span>
                            <span className={`text-xs sm:text-sm font-medium ${staff.pending_assigned > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                              {staff.pending_assigned}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t">
                            <span className="text-xs text-gray-500">Avg. Time:</span>
                            <span className="text-xs font-medium text-gray-700">{staff.avg_completion_time}h</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Quick Actions - WITH LOADING MODAL */}
              <section>
                <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <button
                    onClick={() => handleNavigation("/admin-front/registration-request", "Loading registrations...")}
                    className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg hover:bg-red-100 transition cursor-pointer text-left"
                  >
                    <h4 className="font-semibold text-red-800 text-xs sm:text-sm md:text-base">Review Registrations</h4>
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      Approve or reject pending user registrations
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation("/admin-front/certificate-request", "Loading certificates...")}
                    className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg hover:bg-blue-100 transition cursor-pointer text-left"
                  >
                    <h4 className="font-semibold text-blue-800 text-xs sm:text-sm md:text-base">Process Certificates</h4>
                    <p className="text-xs sm:text-sm text-blue-600 mt-1">
                      Review and approve certificate requests
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation("/admin-front/feedback", "Loading complaints...")}
                    className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg hover:bg-yellow-100 transition cursor-pointer text-left"
                  >
                    <h4 className="font-semibold text-yellow-800 text-xs sm:text-sm md:text-base">Handle Complaints</h4>
                    <p className="text-xs sm:text-sm text-yellow-600 mt-1">
                      Respond to resident feedback
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation("/admin-front/announcement", "Loading announcements...")}
                    className="bg-purple-50 border border-purple-200 p-3 sm:p-4 rounded-lg hover:bg-purple-100 transition cursor-pointer text-left"
                  >
                    <h4 className="font-semibold text-purple-800 text-xs sm:text-sm md:text-base">Post Announcement</h4>
                    <p className="text-xs sm:text-sm text-purple-600 mt-1">
                      Create important community updates
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation("/admin-front/staff-acc", "Loading staff accounts...")}
                    className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg hover:bg-green-100 transition cursor-pointer text-left"
                  >
                    <h4 className="font-semibold text-green-800 text-xs sm:text-sm md:text-base">Manage Staff</h4>
                    <p className="text-xs sm:text-sm text-green-600 mt-1">
                      Add or update staff accounts
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation("/admin-front/reports", "Loading reports...")}
                    className="bg-gray-50 border border-gray-200 p-3 sm:p-4 rounded-lg hover:bg-gray-100 transition cursor-pointer text-left"
                  >
                    <h4 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">View Reports</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Access detailed analytics
                    </p>
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}