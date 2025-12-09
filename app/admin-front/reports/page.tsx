"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  KeyIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Notification {
  notification_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function ReportsSection() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("reports");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [householdMembers, setHouseholdMembers] = useState<any[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imageTitle, setImageTitle] = useState<string>("");
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
  const [allCategoryDetails, setAllCategoryDetails] = useState<Record<string, any[]>>({});

  const [stats, setStats] = useState<Record<string, number>>({
    totalResidents: 0,
    totalStaff: 0,
    totalCertificates: 0,
    totalFeedback: 0,
    totalAnnouncements: 0,
    totalHouseholds: 0,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  const fetchStats = async () => {
    if (!token) {
      setMessage("You are not logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${window.location.origin}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { from: dateRange.from, to: dateRange.to },
        timeout: 50000,
      });

      if (res.data.stats) {
        setStats(res.data.stats);
        setLastUpdated(new Date().toLocaleString());
        setMessage("");
        
        // Fetch all category details for charts
        await fetchAllCategoryDetails();
      } else {
        setMessage("No data received from server.");
      }
    } catch (err: any) {
      console.error("Axios fetchStats error:", err);

      if (err.response) {
        setMessage(`Server Error: ${err.response.status}`);
      } else if (err.request) {
        setMessage("Network Error: Could not reach server.");
      } else {
        setMessage("Unexpected Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategoryDetails = async () => {
    const categories = ['residents', 'staff', 'certificates', 'feedback', 'announcements', 'households'];
    const categoryData: Record<string, any[]> = {};

    for (const category of categories) {
      try {
        const res = await axios.get(`/api/admin/reports?category=${category}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const flattened = res.data.details.map((item: any) => {
          const newItem = { ...item };
          if (item.resident) {
            newItem.resident_id = item.resident.resident_id;
            newItem.resident_first_name = item.resident.first_name;
            newItem.resident_last_name = item.resident.last_name;
            delete newItem.resident;
          }
          if (item.headResident) {
            newItem.head_resident_id = item.headResident.resident_id;
            newItem.head_resident_first_name = item.headResident.first_name;
            newItem.head_resident_last_name = item.headResident.last_name;
            delete newItem.headResident;
          }
          if (item.headStaff) {
            newItem.head_staff_id = item.headStaff.staff_id;
            newItem.head_staff_first_name = item.headStaff.first_name;
            newItem.head_staff_last_name = item.headStaff.last_name;
            delete newItem.headStaff;
          }
          if (item.members) {
            newItem.member_count = item.members.length;
            item.members.forEach((m: any, i: number) => {
              newItem[`member_${i + 1}_id`] = m.resident_id;
              newItem[`member_${i + 1}_first_name`] = m.first_name;
              newItem[`member_${i + 1}_last_name`] = m.last_name;
            });
            delete newItem.members;
          }
          if (item.staff_members) {
            newItem.staff_member_count = item.staff_members.length;
            item.staff_members.forEach((s: any, i: number) => {
              newItem[`staff_member_${i + 1}_id`] = s.staff_id;
              newItem[`staff_member_${i + 1}_first_name`] = s.first_name;
              newItem[`staff_member_${i + 1}_last_name`] = s.last_name;
            });
            delete newItem.staff_members;
          }
          if (item.category) {
            newItem.category_name = item.category.english_name;
            delete newItem.category;
          }
          if (item.respondedBy) {
            newItem.responded_by_username = item.respondedBy.username;
            delete newItem.respondedBy;
          }
          if (item.postedBy) {
            newItem.posted_by_username = item.postedBy.username;
            delete newItem.postedBy;
          }
          return newItem;
        });

        categoryData[category] = flattened;
      } catch (err) {
        console.error(`Error fetching ${category}:`, err);
      }
    }

    setAllCategoryDetails(categoryData);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000ms = 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Reload entire page every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000ms = 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const applyPreset = (preset: string) => {
    const today = new Date();
    let from = "";
    let to = today.toISOString().split("T")[0];
    switch (preset) {
      case "today":
        from = to;
        break;
      case "this-week":
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        from = firstDay.toISOString().split("T")[0];
        break;
      case "this-month":
        from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
        break;
      case "last-month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        from = lastMonth.toISOString().split("T")[0];
        to = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
        break;
      case "year-to-date":
        from = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
        break;
    }
    setDateRange({ from, to });
    setTimeout(fetchStats, 100);
  };

  const fetchDetails = async (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
    setSearchTerm("");
    
    // Use already fetched data if available
    if (allCategoryDetails[category]) {
      setDetails(allCategoryDetails[category]);
    } else {
      try {
        const res = await axios.get(`/api/admin/reports?category=${category}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const flattened = res.data.details.map((item: any) => {
          const newItem = { ...item };
          if (item.resident) {
            newItem.resident_id = item.resident.resident_id;
            newItem.resident_first_name = item.resident.first_name;
            newItem.resident_last_name = item.resident.last_name;
            delete newItem.resident;
          }
          if (item.headResident) {
            newItem.head_resident_id = item.headResident.resident_id;
            newItem.head_resident_first_name = item.headResident.first_name;
            newItem.head_resident_last_name = item.headResident.last_name;
            delete newItem.headResident;
          }
          if (item.headStaff) {
            newItem.head_staff_id = item.headStaff.staff_id;
            newItem.head_staff_first_name = item.headStaff.first_name;
            newItem.head_staff_last_name = item.headStaff.last_name;
            delete newItem.headStaff;
          }
          if (item.members) {
            newItem.member_count = item.members.length;
            item.members.forEach((m: any, i: number) => {
              newItem[`member_${i + 1}_id`] = m.resident_id;
              newItem[`member_${i + 1}_first_name`] = m.first_name;
              newItem[`member_${i + 1}_last_name`] = m.last_name;
            });
            delete newItem.members;
          }
          if (item.staff_members) {
            newItem.staff_member_count = item.staff_members.length;
            item.staff_members.forEach((s: any, i: number) => {
              newItem[`staff_member_${i + 1}_id`] = s.staff_id;
              newItem[`staff_member_${i + 1}_first_name`] = s.first_name;
              newItem[`staff_member_${i + 1}_last_name`] = s.last_name;
            });
            delete newItem.staff_members;
          }
          if (item.category) {
            newItem.category_name = item.category.english_name;
            delete newItem.category;
          }
          if (item.respondedBy) {
            newItem.responded_by_username = item.respondedBy.username;
            delete newItem.respondedBy;
          }
          if (item.postedBy) {
            newItem.posted_by_username = item.postedBy.username;
            delete newItem.postedBy;
          }
          return newItem;
        });

        setDetails(flattened);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchHouseholdMembers = async (householdId: number) => {
    try {
      const res = await axios.get(`/api/admin/reports?category=households&householdId=${householdId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const household = res.data.details[0];
      setSelectedHousehold(household);
      setHouseholdMembers([...(household.members || []), ...(household.staff_members || [])]);
      setShowHouseholdModal(true);
    } catch (err) {
      console.error("Error fetching household members:", err);
    }
  };

  const filteredDetails = useMemo(() => {
    let filtered = details.filter((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig) {
      filtered = filtered.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [details, searchTerm, sortConfig, currentPage]);

  const totalPages = Math.ceil(
    details.filter((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    ).length / itemsPerPage
  );

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const getChartData = (category: string) => {
    const categoryDetails = allCategoryDetails[category] || [];
    if (categoryDetails.length === 0) return [];

    switch (category) {
      case "certificates":
        const statusCount = categoryDetails.reduce((acc: any, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(statusCount).map(([name, value]) => ({ name, value }));

      case "feedback":
        const feedbackStatus = categoryDetails.reduce((acc: any, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(feedbackStatus).map(([name, value]) => ({ name, value }));

      case "households":
        return categoryDetails.slice(0, 10).map(item => ({
          name: `H-${item.id}`,
          members: (item.member_count || 0) + (item.staff_member_count || 0)
        }));

      case "residents":
        const ageGroups = categoryDetails.reduce((acc: any, item) => {
          const age = new Date().getFullYear() - new Date(item.birthdate).getFullYear();
          const group = age < 18 ? "0-17" : age < 35 ? "18-34" : age < 60 ? "35-59" : "60+";
          acc[group] = (acc[group] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));

      case "staff":
      const performanceData: Record<string, number> = {};
      
      categoryDetails.forEach((staff: any) => {
        if (staff.approved_requests) performanceData["Approved Requests"] = (performanceData["Approved Requests"] || 0) + staff.approved_requests;
        if (staff.approved_certificates) performanceData["Approved Certificates"] = (performanceData["Approved Certificates"] || 0) + staff.approved_certificates;
        if (staff.claimed_certificates) performanceData["Claimed Certificates"] = (performanceData["Claimed Certificates"] || 0) + staff.claimed_certificates;
      });

      return Object.entries(performanceData).map(([name, value]) => ({ name, value }));

      case "announcements":
        const now = new Date();
        const activeExpired = categoryDetails.reduce((acc: any, item) => {
          const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
          const status = expiryDate && expiryDate < now ? "Expired" : "Active";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(activeExpired).map(([name, value]) => ({ name, value }));

      default:
        return [];
    }
  };

// Add this helper function to generate chart interpretations
const getChartInterpretation = (category: string, chartData: any[]) => {
  if (chartData.length === 0) return "No data available for analysis.";

  switch (category) {
    case "certificates":
      const totalCerts = chartData.reduce((sum, item) => sum + item.value, 0);
      const pending = chartData.find(item => item.name === "pending")?.value || 0;
      const approved = chartData.find(item => item.name === "approved")?.value || 0;
      const claimed = chartData.find(item => item.name === "claimed")?.value || 0;
      const rejected = chartData.find(item => item.name === "rejected")?.value || 0;
      
      return `Total Certificate Requests: ${totalCerts}
- Pending: ${pending} (${((pending/totalCerts)*100).toFixed(1)}%)
- Approved: ${approved} (${((approved/totalCerts)*100).toFixed(1)}%)
- Claimed: ${claimed} (${((claimed/totalCerts)*100).toFixed(1)}%)
- Rejected: ${rejected} (${((rejected/totalCerts)*100).toFixed(1)}%)

Analysis: ${pending > approved ? "There is a backlog of pending requests that needs attention." : "Certificate processing is moving efficiently."} ${claimed > 0 ? `${claimed} certificates have been successfully claimed by residents.` : ""}`;

    case "feedback":
      const totalFeedback = chartData.reduce((sum, item) => sum + item.value, 0);
      const pendingFeedback = chartData.find(item => item.name === "pending")?.value || 0;
      const respondedFeedback = chartData.find(item => item.name === "responded")?.value || 0;
      
      return `Total Feedback/Complaints: ${totalFeedback}
- Pending: ${pendingFeedback} (${((pendingFeedback/totalFeedback)*100).toFixed(1)}%)
- Responded: ${respondedFeedback} (${((respondedFeedback/totalFeedback)*100).toFixed(1)}%)

Analysis: Response rate is ${((respondedFeedback/totalFeedback)*100).toFixed(1)}%. ${pendingFeedback > 0 ? `${pendingFeedback} complaint(s) still require attention.` : "All complaints have been addressed."}`;

    case "households":
      const avgMembers = chartData.reduce((sum, item) => sum + item.members, 0) / chartData.length;
      const maxHousehold = chartData.reduce((max, item) => item.members > max.members ? item : max, chartData[0]);
      const minHousehold = chartData.reduce((min, item) => item.members < min.members ? item : min, chartData[0]);
      
      return `Household Distribution (Top 10):
- Average members per household: ${avgMembers.toFixed(1)}
- Largest household: ${maxHousehold.name} with ${maxHousehold.members} members
- Smallest household: ${minHousehold.name} with ${minHousehold.members} members

Analysis: The data shows variation in household sizes, which is useful for resource allocation and community planning.`;

    case "residents":
      const totalResidents = chartData.reduce((sum, item) => sum + item.value, 0);
      const youth = chartData.find(item => item.name === "0-17")?.value || 0;
      const youngAdults = chartData.find(item => item.name === "18-34")?.value || 0;
      const middleAge = chartData.find(item => item.name === "35-59")?.value || 0;
      const seniors = chartData.find(item => item.name === "60+")?.value || 0;
      
      return `Resident Age Distribution (Total: ${totalResidents}):
- Youth (0-17): ${youth} (${((youth/totalResidents)*100).toFixed(1)}%)
- Young Adults (18-34): ${youngAdults} (${((youngAdults/totalResidents)*100).toFixed(1)}%)
- Middle Age (35-59): ${middleAge} (${((middleAge/totalResidents)*100).toFixed(1)}%)
- Seniors (60+): ${seniors} (${((seniors/totalResidents)*100).toFixed(1)}%)

Analysis: ${youth > totalResidents * 0.3 ? "High youth population suggests need for educational and recreational facilities." : ""} ${seniors > totalResidents * 0.2 ? "Significant senior population indicates need for healthcare and accessibility services." : ""}`;

    case "staff":
      const totalApprovals = chartData.reduce((sum, item) => sum + item.value, 0);
      
      return `Staff Performance Summary:
${chartData.map(item => `- ${item.name}: ${item.value}`).join('\n')}
- Total Activities: ${totalApprovals}

Analysis: Staff members are actively processing requests and certificates, contributing to efficient barangay operations.`;

    case "announcements":
      const totalAnnouncements = chartData.reduce((sum, item) => sum + item.value, 0);
      const active = chartData.find(item => item.name === "Active")?.value || 0;
      const expired = chartData.find(item => item.name === "Expired")?.value || 0;
      
      return `Announcement Status (Total: ${totalAnnouncements}):
- Active: ${active} (${((active/totalAnnouncements)*100).toFixed(1)}%)
- Expired: ${expired} (${((expired/totalAnnouncements)*100).toFixed(1)}%)

Analysis: ${active > 0 ? `${active} active announcement(s) are currently visible to residents.` : "No active announcements at this time."} ${expired > active * 2 ? "Consider archiving old announcements." : ""}`;

    default:
      return "No interpretation available.";
  }
};

// Update the handleExportPDF function - replace the font setting lines
const handleExportPDF = () => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  doc.setFontSize(18);
  doc.text("Barangay Report Summary", 14, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  if (dateRange.from || dateRange.to) {
    doc.text(`Period: ${dateRange.from || 'Start'} to ${dateRange.to || 'Today'}`, 14, yPosition);
    yPosition += 7;
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 12;
  
  // Statistics table
  autoTable(doc, {
    startY: yPosition,
    head: [["Category", "Count"]],
    body: Object.entries(stats)
      .filter(([_, value]) => typeof value === "number")
      .map(([key, value]) => [key.replace(/^total/i, ""), value]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [220, 38, 38] },
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // Add interpretations for each category
  doc.setFontSize(14);
  doc.text("Data Analysis & Insights", 14, yPosition);
  yPosition += 10;
  
  doc.setFontSize(9);
  const categories: Array<'certificates' | 'feedback' | 'households' | 'residents' | 'staff' | 'announcements'> = 
    ['certificates', 'feedback', 'households', 'residents', 'staff', 'announcements'];
  
  categories.forEach(category => {
    const chartData = getChartData(category);
    if (chartData.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold'); // Fixed: specify font family
      doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)}:`, 14, yPosition);
      yPosition += 7;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal'); // Fixed: specify font family
      const interpretation = getChartInterpretation(category, chartData);
      const lines = doc.splitTextToSize(interpretation, 180);
      doc.text(lines, 14, yPosition);
      yPosition += (lines.length * 5) + 8;
    }
  });
  
  doc.save("barangay_report.pdf");
};

// Update handleExportDetailedPDF function - replace the font setting lines
const handleExportDetailedPDF = () => {
  if (!activeCategory || details.length === 0) return;
  
  const doc = new jsPDF();
  let yPosition = 16;
  
  // Add title
  doc.setFontSize(16);
  doc.text(`${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Detailed Report`, 14, yPosition);
  yPosition += 8;
  
  // Add date range if applicable
  doc.setFontSize(10);
  if (dateRange.from || dateRange.to) {
    doc.text(`Period: ${dateRange.from || 'Start'} to ${dateRange.to || 'Today'}`, 14, yPosition);
    yPosition += 6;
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Total Records: ${details.length}`, 14, yPosition);
  yPosition += 10;
  
  // Add interpretation section
  const chartData = getChartData(activeCategory);
  if (chartData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold'); // Fixed: specify font family
    doc.text("Data Analysis:", 14, yPosition);
    yPosition += 7;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal'); // Fixed: specify font family
    const interpretation = getChartInterpretation(activeCategory, chartData);
    const lines = doc.splitTextToSize(interpretation, 180);
    doc.text(lines, 14, yPosition);
    yPosition += (lines.length * 5) + 10;
  }
  
  // Add table
  autoTable(doc, {
    startY: yPosition,
    head: [Object.keys(details[0])
      .filter(key => !key.startsWith('member_') && !key.startsWith('staff_member_'))
      .map((k) => k.replaceAll("_", " ").toUpperCase())],
    body: details.map((d) => 
      Object.entries(d)
        .filter(([key]) => !key.startsWith('member_') && !key.startsWith('staff_member_'))
        .map(([key, v]) => {
          // Format dates
          if ([
            "created_at",
            "requested_at",
            "approved_at",
            "submitted_at",
            "responded_at",
            "posted_at",
            "expiry_date",
          ].includes(key) && v) {
            return new Date(v as string).toLocaleDateString();
          }
          return String(v ?? '');
        })
    ),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 38, 38] },
  });
  
  doc.save(`${activeCategory}_detailed_report.pdf`);
};

  const handleExportCSV = () => {
    const csv = Object.entries(stats)
      .filter(([_, value]) => typeof value === "number")
      .map(([key, value]) => [key.replace(/^total/i, ""), value])
      .map((e) => e.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barangay_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      router.push("/auth-front/login");
    }
  };

  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#8AFF33", "#FF8A33", "#B833FF"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-2 sm:p-4 flex flex-col md:flex-row gap-2 sm:gap-4">
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
              sidebarOpen ? "w-24 h-24 sm:w-30 sm:h-30" : "w-8 h-8"
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
                  href={`/admin-front/${name}`}
                  onClick={() => setActiveItem(name)}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name ? "text-red-700 font-semibold" : "text-black hover:text-red-700"
                  }`}
                >
                  {activeItem === name && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-6 h-6 mr-2 ${
                      activeItem === name ? "text-red-700" : "text-gray-600 group-hover:text-red-700"
                    }`}
                  />
                  {sidebarOpen && (
                    <span className={`${activeItem === name ? "text-red-700" : "group-hover:text-red-700"}`}>
                      {label}
                    </span>
                  )}
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
            {sidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5 text-black" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-black" />
            )}
          </button>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar}></div>}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-2 sm:gap-4 overflow-y-auto min-w-0">
        <header className="bg-gray-50 shadow-sm p-3 sm:p-4 flex justify-between items-center rounded-xl text-black">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none mr-2"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-base sm:text-lg font-bold truncate">Manage Reports</h1>
          <div className="flex items-center space-x-2 sm:space-x-4"></div>
        </header>

        <main className="flex-1 bg-white/80 backdrop-blur-md shadow-md rounded-xl p-3 sm:p-4 md:p-6 min-w-0">
          {/* Date Range Form */}
          <div className="flex flex-col gap-3 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm text-black focus:border-red-600 focus:ring-red-600"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm text-black focus:border-red-600 focus:ring-red-600"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {["today", "this-week", "this-month", "last-month", "year-to-date"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className="bg-gray-200 hover:bg-gray-300 px-2 sm:px-3 py-1 rounded-lg text-black text-xs sm:text-sm whitespace-nowrap"
                >
                  {preset.replaceAll("-", " ")}
                </button>
              ))}
            </div>
            
            <button
              type="button"
              onClick={fetchStats}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg shadow-sm transition-all w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Generate</span>
            </button>
            
            {lastUpdated && <p className="text-xs sm:text-sm text-gray-500">Last updated: {lastUpdated}</p>}
          </div>

          {/* Statistics Cards */}
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Loading stats...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              {Object.entries(stats)
                .filter(([_, value]) => typeof value === "number")
                .map(([key, value]) => (
                  <div
                    key={key}
                    onClick={() => fetchDetails(key.replace(/^total/i, "").toLowerCase())}
                    className="cursor-pointer bg-white shadow-md p-4 sm:p-6 rounded-lg hover:bg-red-50 transition flex flex-col items-start"
                  >
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">{key.replace(/^total/i, "")}</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-red-700 mt-2">{value}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Click to view details</p>
                  </div>
                ))}
            </div>
          )}

          {/* Charts Section */}
          {!loading && Object.keys(allCategoryDetails).length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Data Visualizations</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Certificates Chart */}
                {allCategoryDetails.certificates && allCategoryDetails.certificates.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Certificate Requests Status</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={getChartData('certificates')}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {getChartData('certificates').map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ color: "black", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Feedback Chart */}
                {allCategoryDetails.feedback && allCategoryDetails.feedback.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Feedback Status</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={getChartData('feedback')}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {getChartData('feedback').map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ color: "black", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Households Chart */}
                {allCategoryDetails.households && allCategoryDetails.households.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Household Members (Top 10)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={getChartData('households')}>
                        <XAxis dataKey="name" stroke="#000" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#000" style={{ fontSize: '12px' }} />
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Bar dataKey="members" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Residents Age Distribution */}
                {allCategoryDetails.residents && allCategoryDetails.residents.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Residents Age Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={getChartData('residents')}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {getChartData('residents').map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ color: "black", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Staff Performance Distribution */}
                {allCategoryDetails.staff && allCategoryDetails.staff.length > 0 && getChartData('staff').length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Staff Performance Metrics</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={getChartData('staff')}>
                        <XAxis dataKey="name" stroke="#000" angle={-45} textAnchor="end" height={100} style={{ fontSize: '10px' }} />
                        <YAxis stroke="#000" style={{ fontSize: '12px' }} />
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Bar dataKey="value" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              onClick={handleExportPDF}
              className="bg-red-700 hover:bg-red-800 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto text-sm"
            >
              <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto text-sm"
            >
              <ClipboardDocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Export CSV
            </button>
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {activeCategory && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl p-4 sm:p-6 relative max-h-[90vh] overflow-auto">
            <button
              onClick={() => {
                setActiveCategory(null);
                setDetails([]);
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-700 z-10 bg-white rounded-full p-1"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4 capitalize pr-8">{activeCategory} Details</h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="mb-3 sm:mb-4 w-full p-2 border border-gray-300 rounded-md focus:ring-red-600 focus:border-red-600 text-sm"
            />

            {/* Table */}
            {details.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">No records found.</p>
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full border border-gray-200 rounded-lg">
                        <thead className="bg-red-700 text-white">
                          <tr>
                            {Object.keys(details[0])
                              .filter(key => !key.startsWith('member_') && !key.startsWith('staff_member_'))
                              .map((key) => (
                                <th
                                  key={key}
                                  className="px-3 sm:px-4 py-2 text-left capitalize cursor-pointer hover:bg-red-800 text-xs sm:text-sm whitespace-nowrap"
                                  onClick={() => requestSort(key)}
                                >
                                  {key.replaceAll("_", " ")}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDetails.map((item, i) => (
                            <tr key={i} className="border-t hover:bg-red-50 transition">
                              {Object.entries(item)
                                .filter(([key]) => !key.startsWith('member_') && !key.startsWith('staff_member_'))
                                .map(([key, val], j) => (
                                  <td key={j} className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700">
                                    {key === "head_resident_first_name" && activeCategory === "households" ? (
                                      <button
                                        onClick={() => fetchHouseholdMembers(item.id)}
                                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                                      >
                                        {String(val)} {item.head_resident_last_name}
                                      </button>
                                    ) : key === "head_staff_first_name" && activeCategory === "households" ? (
                                      <button
                                        onClick={() => fetchHouseholdMembers(item.id)}
                                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                                      >
                                        {String(val)} {item.head_staff_last_name}
                                      </button>
                                    ) : (key === "proof_file" || key === "response_proof_file") && activeCategory === "feedback" && val ? (
                                      <button
                                        onClick={() => {
                                          setSelectedImage(String(val));
                                          setImageTitle(key === "proof_file" ? "Proof File" : "Response Proof File");
                                          setShowImageModal(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 underline font-medium whitespace-nowrap"
                                      >
                                        View Image
                                      </button>
                                    ) : key === "member_count" || key === "staff_member_count" ? (
                                      <span className="font-semibold text-red-700">{String(val)}</span>
                                    ) : [
                                        "created_at",
                                        "requested_at",
                                        "approved_at",
                                        "submitted_at",
                                        "responded_at",
                                        "posted_at",
                                        "expiry_date",
                                      ].includes(key) ? (
                                      <span className="whitespace-nowrap">{val ? new Date(val as string).toLocaleDateString() : 'N/A'}</span>
                                    ) : (
                                      <span className="break-words">{String(val ?? '')}</span>
                                    )}
                                  </td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-between mt-3 sm:mt-4 items-center text-sm">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm"
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <p className="text-xs sm:text-sm">
                    Page {currentPage} of {totalPages}
                  </p>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm"
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>

                {/* Export Detailed PDF */}
                <button
                  onClick={handleExportDetailedPDF}
                  className="mt-3 sm:mt-4 bg-red-700 hover:bg-red-800 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto text-sm"
                >
                  <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Export Detailed PDF
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Household Members Modal - Separate layer */}
      {showHouseholdModal && selectedHousehold && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[65]" onClick={() => {
            setShowHouseholdModal(false);
            setSelectedHousehold(null);
            setHouseholdMembers([]);
          }}></div>
          <div className="fixed inset-0 flex justify-center items-center z-[70] p-2 sm:p-4 pointer-events-none">
            <div className="bg-white rounded-xl w-full max-w-4xl p-4 sm:p-6 relative max-h-[90vh] overflow-auto pointer-events-auto shadow-2xl">
              <button
                onClick={() => {
                  setShowHouseholdModal(false);
                  setSelectedHousehold(null);
                  setHouseholdMembers([]);
                }}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-700 z-10 bg-white rounded-full p-1"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <h2 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6 pr-8">
                Household #{selectedHousehold.id} Members
              </h2>
              
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-gray-50 rounded-lg border border-red-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Household Head</h3>
                    {selectedHousehold.headResident && (
                      <p className="text-gray-700 text-sm sm:text-base">
                        <span className="font-medium">{selectedHousehold.headResident.first_name} {selectedHousehold.headResident.last_name}</span>
                        <span className="text-xs sm:text-sm text-gray-500 ml-2 px-2 py-0.5 bg-blue-100 rounded">(Resident)</span>
                      </p>
                    )}
                    {selectedHousehold.headStaff && (
                      <p className="text-gray-700 text-sm sm:text-base">
                        <span className="font-medium">{selectedHousehold.headStaff.first_name} {selectedHousehold.headStaff.last_name}</span>
                        <span className="text-xs sm:text-sm text-gray-500 ml-2 px-2 py-0.5 bg-green-100 rounded">(Staff)</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Statistics</h3>
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium">Total Members:</span> {householdMembers.length}
                    </p>
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium">Residents:</span> {householdMembers.filter(m => m.resident_id).length}
                    </p>
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium">Staff:</span> {householdMembers.filter(m => m.staff_id).length}
                    </p>
                  </div>
                </div>
              </div>

              {householdMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-sm">No members found.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full border border-gray-200 rounded-lg">
                        <thead className="bg-red-700 text-white">
                          <tr>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">ID</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Name</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Type</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Gender</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Contact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {householdMembers.map((member, i) => (
                            <tr key={i} className="border-t hover:bg-red-50 transition">
                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 font-medium">
                                {member.resident_id || member.staff_id}
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">
                                {member.first_name} {member.last_name}
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                  member.resident_id ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {member.resident_id ? 'Resident' : 'Staff'}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">
                                {member.gender || 'N/A'}
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">
                                {member.contact_no || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[75]" onClick={() => {
            setShowImageModal(false);
            setSelectedImage("");
            setImageTitle("");
          }}></div>
          <div className="fixed inset-0 flex justify-center items-center z-[80] p-2 sm:p-4 pointer-events-none">
            <div className="bg-white rounded-xl w-full max-w-4xl p-4 sm:p-6 relative max-h-[90vh] overflow-auto pointer-events-auto shadow-2xl">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage("");
                  setImageTitle("");
                }}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-700 z-10 bg-white rounded-full p-1.5 sm:p-2 shadow-md"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <h2 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4 pr-10">
                {imageTitle}
              </h2>
              
              <div className="flex justify-center items-center">
                <img 
                  src={selectedImage} 
                  alt={imageTitle}
                  className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%236b7280">Image not available</text></svg>';
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}