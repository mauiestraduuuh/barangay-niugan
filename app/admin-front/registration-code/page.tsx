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
  Bars3Icon,
  ChevronLeftIcon,
  KeyIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface RegistrationCode {
  id: number;
  code: string;
  ownerName: string;
  isUsed: boolean;
  usedById?: number | null;
}

export default function RegistrationCodePage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [filter, setFilter] = useState<"used" | "unused">("unused");
  const [ownerName, setOwnerName] = useState("");
  const [message, setMessage] = useState("");
  const [activeItem, setActiveItem] = useState("registration-code");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Fetch all registration codes
  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/registration-code");
      if (res.data.success) setCodes(res.data.codes);
      else setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch codes");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Generate a new code
  const generateCode = async () => {
    if (!ownerName.trim()) {
      setMessage("Owner name is required");
      return;
    }
    try {
      const res = await axios.post("/api/admin/registration-code", { ownerName });
      if (res.data.success) {
        setMessage("Code generated successfully!");
        setOwnerName("");
        fetchCodes();
      } else setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create code");
    }
  };

  // Delete unused code
  const deleteCode = async (id: number) => {
    if (!confirm("Are you sure you want to delete this code?")) return;
    try {
      const res = await axios.delete("/api/admin/registration-code", { data: { id } });
      if (res.data.success) {
        setMessage("Code deleted successfully");
        fetchCodes();
      } else setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete code");
    }
  };

  const filteredCodes = codes.filter((c) => (filter === "unused" ? !c.isUsed : c.isUsed));

  const features = [
    { name: "the-dash-admin", label: "Home", icon: HomeIcon },
    { name: "admin-profile", label: "Manage Profile", icon: UserIcon },
    { name: "registration-request", label: "Registration Requests", icon: ClipboardDocumentIcon },
    { name: "registration-code", label: "Registration Code", icon: KeyIcon },
    { name: "certificate-request", label: "Certificate Requests", icon: ClipboardDocumentIcon },
    { name: "feedback", label: "Feedback", icon: ChatBubbleLeftEllipsisIcon },
    { name: "staff-acc", label: "Staff Accounts", icon: UsersIcon },
    { name: "announcement", label: "Announcements", icon: MegaphoneIcon },
    { name: "reports", label: "Reports", icon: ChartBarIcon },
  ];

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-4 flex gap-4 ">
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

      {/* Main Section */}
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

        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-4 text-black">Registration Codes</h1>

          {message && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">{message}</div>
          )}

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
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Generate
            </button>

            {/* Filter Toggle */}
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
            <p className="text-black">Loading...</p>
          ) : (
            <table className="min-w-full border-collapse bg-white shadow-sm rounded-xl overflow-hidden text-sm sm:text-base">
              <thead className="bg-gradient-to-br from-black via-red-800 to-black text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Owner</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-2 font-medium text-black">{c.code}</td>
                    <td className="px-4 py-2 text-black">{c.ownerName}</td>
                    <td className="px-4 py-2 text-center text-black">
                      {c.isUsed ? "USED" : "UNUSED"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {!c.isUsed && (
                        <button
                          onClick={() => deleteCode(c.id)}
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </div>
  );
}
