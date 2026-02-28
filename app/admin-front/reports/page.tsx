"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
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
  UserGroupIcon,
  HeartIcon,
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

const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#8AFF33", "#FF8A33", "#B833FF"];

// ---------- Helpers ----------

const getAge = (birthdate: string) => {
  if (!birthdate) return null;
  const ageDiff = Date.now() - new Date(birthdate).getTime();
  return Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 365.25));
};

// ---------- Component ----------

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

  // New: special report modal
  const [showSpecialReport, setShowSpecialReport] = useState(false);
  const [specialReportType, setSpecialReportType] = useState<"senior" | "pwd" | "gender" | "numeric" | null>(null);

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

  // -------- Fetch --------

  const fetchStats = async () => {
    if (!token) { setMessage("You are not logged in."); setLoading(false); return; }
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
        await fetchAllCategoryDetails();
      } else { setMessage("No data received from server."); }
    } catch (err: any) {
      if (err.response) setMessage(`Server Error: ${err.response.status}`);
      else if (err.request) setMessage("Network Error: Could not reach server.");
      else setMessage("Unexpected Error: " + err.message);
    } finally { setLoading(false); }
  };

  const flattenItem = (item: any) => {
    const n = { ...item };
    if (item.resident) { n.resident_id = item.resident.resident_id; n.resident_first_name = item.resident.first_name; n.resident_last_name = item.resident.last_name; delete n.resident; }
    if (item.headResident) { n.head_resident_id = item.headResident.resident_id; n.head_resident_first_name = item.headResident.first_name; n.head_resident_last_name = item.headResident.last_name; delete n.headResident; }
    if (item.headStaff) { n.head_staff_id = item.headStaff.staff_id; n.head_staff_first_name = item.headStaff.first_name; n.head_staff_last_name = item.headStaff.last_name; delete n.headStaff; }
    if (item.members) { n.member_count = item.members.length; item.members.forEach((m: any, i: number) => { n[`member_${i+1}_id`] = m.resident_id; n[`member_${i+1}_first_name`] = m.first_name; n[`member_${i+1}_last_name`] = m.last_name; }); delete n.members; }
    if (item.staff_members) { n.staff_member_count = item.staff_members.length; item.staff_members.forEach((s: any, i: number) => { n[`staff_member_${i+1}_id`] = s.staff_id; n[`staff_member_${i+1}_first_name`] = s.first_name; n[`staff_member_${i+1}_last_name`] = s.last_name; }); delete n.staff_members; }
    if (item.category) { n.category_name = item.category.english_name; delete n.category; }
    if (item.respondedBy) { n.responded_by_username = item.respondedBy.username; delete n.respondedBy; }
    if (item.postedBy) { n.posted_by_username = item.postedBy.username; delete n.postedBy; }
    return n;
  };

  const fetchAllCategoryDetails = async () => {
    const categories = ['residents', 'staff', 'certificates', 'feedback', 'announcements', 'households'];
    const categoryData: Record<string, any[]> = {};
    for (const category of categories) {
      try {
        const res = await axios.get(`/api/admin/reports?category=${category}`, { headers: { Authorization: `Bearer ${token}` } });
        categoryData[category] = res.data.details.map(flattenItem);
      } catch (err) { console.error(`Error fetching ${category}:`, err); }
    }
    setAllCategoryDetails(categoryData);
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { const interval = setInterval(() => window.location.reload(), 300000); return () => clearInterval(interval); }, []);

  const applyPreset = (preset: string) => {
    const today = new Date();
    let from = "";
    let to = today.toISOString().split("T")[0];
    switch (preset) {
      case "today": from = to; break;
      case "this-week": from = new Date(new Date(today).setDate(today.getDate() - today.getDay())).toISOString().split("T")[0]; break;
      case "this-month": from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]; break;
      case "last-month": from = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0]; to = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0]; break;
      case "year-to-date": from = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0]; break;
    }
    setDateRange({ from, to });
    setTimeout(fetchStats, 100);
  };

  const fetchDetails = async (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
    setSearchTerm("");
    if (allCategoryDetails[category]) { setDetails(allCategoryDetails[category]); return; }
    try {
      const res = await axios.get(`/api/admin/reports?category=${category}`, { headers: { Authorization: `Bearer ${token}` } });
      setDetails(res.data.details.map(flattenItem));
    } catch (err) { console.error(err); }
  };

  const fetchHouseholdMembers = async (householdId: number) => {
    try {
      const res = await axios.get(`/api/admin/reports?category=households&householdId=${householdId}`, { headers: { Authorization: `Bearer ${token}` } });
      const household = res.data.details[0];
      setSelectedHousehold(household);
      setHouseholdMembers([...(household.members || []), ...(household.staff_members || [])]);
      setShowHouseholdModal(true);
    } catch (err) { console.error("Error fetching household members:", err); }
  };

  // -------- Derived data for special reports --------

  const residents = allCategoryDetails.residents || [];

  const seniors = useMemo(() => residents.filter(r => (getAge(r.birthdate) ?? 0) >= 60), [residents]);
  const pwdList = useMemo(() => residents.filter(r => r.is_pwd || r.pwd), [residents]);
  
  const maleResidents = useMemo(() => residents.filter(r => r.gender?.toLowerCase() === 'male'), [residents]);
  const femaleResidents = useMemo(() => residents.filter(r => r.gender?.toLowerCase() === 'female'), [residents]);

  const genderChartData = useMemo(() => [
    { name: "Male", value: maleResidents.length },
    { name: "Female", value: femaleResidents.length },
  ], [maleResidents, femaleResidents]);

  // Numeric analytics
  const numericReport = useMemo(() => {
    const certs = allCategoryDetails.certificates || [];
    const feedbacks = allCategoryDetails.feedback || [];
    const hh = allCategoryDetails.households || [];
    const ageGroups = residents.reduce((acc: any, r) => {
      const age = getAge(r.birthdate) ?? 0;
      const g = age < 18 ? "Youth (0–17)" : age < 35 ? "Young Adult (18–34)" : age < 60 ? "Middle Age (35–59)" : "Senior (60+)";
      acc[g] = (acc[g] || 0) + 1; return acc;
    }, {});
    return {
      totalResidents: residents.length,
      male: maleResidents.length,
      female: femaleResidents.length,
      seniors: seniors.length,
      youth: ageGroups["Youth (0–17)"] || 0,
      youngAdult: ageGroups["Young Adult (18–34)"] || 0,
      middleAge: ageGroups["Middle Age (35–59)"] || 0,
      ageGroups,
      totalCerts: certs.length,
      pendingCerts: certs.filter((c: any) => c.status?.toLowerCase() === "pending").length,
      approvedCerts: certs.filter((c: any) => c.status?.toLowerCase() === "approved").length,
      claimedCerts: certs.filter((c: any) => c.status?.toLowerCase() === "claimed").length,
      rejectedCerts: certs.filter((c: any) => c.status?.toLowerCase() === "rejected").length,
      totalFeedback: feedbacks.length,
      pendingFeedback: feedbacks.filter((f: any) => f.status?.toLowerCase() === "pending").length,
      inProgressFeedback: feedbacks.filter((f: any) => f.status?.toLowerCase().includes("progress")).length,
      resolvedFeedback: feedbacks.filter((f: any) => f.status?.toLowerCase() === "resolved").length,
      totalHouseholds: hh.length,
      avgHouseholdSize: hh.length ? (hh.reduce((s: number, h: any) => s + ((h.member_count || 0) + (h.staff_member_count || 0)), 0) / hh.length).toFixed(2) : 0,
    };
  }, [allCategoryDetails, residents, maleResidents, femaleResidents, seniors]);

  // -------- Chart data --------

  const getChartData = (category: string) => {
    const d = allCategoryDetails[category] || [];
    if (!d.length) return [];
    switch (category) {
      case "certificates": { const c: any = {}; d.forEach((i: any) => { c[i.status] = (c[i.status] || 0) + 1; }); return Object.entries(c).map(([name, value]) => ({ name, value })); }
      case "feedback": { const c: any = {}; d.forEach((i: any) => { c[i.status] = (c[i.status] || 0) + 1; }); return Object.entries(c).map(([name, value]) => ({ name, value })); }
      case "households": return d.slice(0, 10).map((i: any) => ({ name: `H-${i.id}`, members: (i.member_count || 0) + (i.staff_member_count || 0) }));
      case "residents": { const ag: any = {}; d.forEach((i: any) => { const age = getAge(i.birthdate) ?? 0; const g = age < 18 ? "0–17" : age < 35 ? "18–34" : age < 60 ? "35–59" : "60+"; ag[g] = (ag[g] || 0) + 1; }); return Object.entries(ag).map(([name, value]) => ({ name, value })); }
      case "gender": return [{ name: "Male", value: maleResidents.length }, { name: "Female", value: femaleResidents.length }];
      case "staff": { const p: any = {}; d.forEach((s: any) => { if (s.approved_requests) p["Approved Requests"] = (p["Approved Requests"] || 0) + s.approved_requests; if (s.approved_certificates) p["Approved Certificates"] = (p["Approved Certificates"] || 0) + s.approved_certificates; if (s.claimed_certificates) p["Claimed Certificates"] = (p["Claimed Certificates"] || 0) + s.claimed_certificates; }); return Object.entries(p).map(([name, value]) => ({ name, value })); }
      case "announcements": { const now = new Date(); const c: any = {}; d.forEach((i: any) => { const s = i.expiry_date && new Date(i.expiry_date) < now ? "Expired" : "Active"; c[s] = (c[s] || 0) + 1; }); return Object.entries(c).map(([name, value]) => ({ name, value })); }
      default: return [];
    }
  };

  // -------- Filtering --------

  const filteredDetails = useMemo(() => {
    let filtered = details.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase())));
    if (sortConfig) filtered = filtered.sort((a: any, b: any) => { const av = a[sortConfig.key]; const bv = b[sortConfig.key]; if (av < bv) return sortConfig.direction === "asc" ? -1 : 1; if (av > bv) return sortConfig.direction === "asc" ? 1 : -1; return 0; });
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [details, searchTerm, sortConfig, currentPage]);

  const totalPages = Math.ceil(details.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))).length / itemsPerPage);
  const requestSort = (key: string) => { let dir: "asc" | "desc" = "asc"; if (sortConfig?.key === key && sortConfig.direction === "asc") dir = "desc"; setSortConfig({ key, direction: dir }); };

  // -------- PDF Helpers --------

  const drawPieChart = (doc: any, data: { name: string; value: number }[], cx: number, cy: number, r: number) => {
    const total = data.reduce((s, d) => s + (d.value as number), 0);
    if (total === 0) return;
    const pColors = ["#FF6384", "#36A2EB", "#FFCE56", "#8AFF33", "#FF8A33", "#B833FF"];

    const hexToRgb = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });

    let startAngle = -Math.PI / 2;
    data.forEach((d, i) => {
      const slice = ((d.value as number) / total) * 2 * Math.PI;
      if (slice === 0) { startAngle += slice; return; }
      const endAngle = startAngle + slice;
      const { r: rr, g: gg, b: bb } = hexToRgb(pColors[i % pColors.length]);

      // Build slice path using jsPDF lines() — moves to center, draws arc steps, closes
      const steps = Math.max(16, Math.ceil((slice / (2 * Math.PI)) * 48));
      // lines() takes relative line segments: [[dx, dy], ...]
      // We use moveTo + lines to draw the slice as a filled polygon
      doc.setFillColor(rr, gg, bb);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);

      // Collect absolute points for the slice
      const pts: [number, number][] = [];
      pts.push([cx, cy]); // center
      for (let j = 0; j <= steps; j++) {
        const a = startAngle + (slice * j) / steps;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }

      // Convert to relative segments for doc.lines()
      const segments: [number, number, number, number, number, number][] = [];
      for (let k = 1; k < pts.length; k++) {
        const dx = pts[k][0] - pts[k - 1][0];
        const dy = pts[k][1] - pts[k - 1][1];
        // Straight line segment: [x1, y1, x2, y2, x, y] where control points = endpoint
        segments.push([dx, dy, dx, dy, dx, dy]);
      }

      doc.lines(segments, pts[0][0], pts[0][1], [1, 1], "F", true);
      startAngle = endAngle;
    });

    // Legend
    const legendX = cx + r + 6;
    data.forEach((d, i) => {
      const { r: rr, g: gg, b: bb } = hexToRgb(pColors[i % pColors.length]);
      const legendY = cy - r + i * 9;
      doc.setFillColor(rr, gg, bb);
      doc.rect(legendX, legendY, 4, 4, "F");
      doc.setFontSize(7);
      doc.setTextColor(50, 50, 50);
      const pct = total > 0 ? (((d.value as number) / total) * 100).toFixed(1) : "0.0";
      doc.text(`${d.name}: ${d.value} (${pct}%)`, legendX + 6, legendY + 3.5);
    });
  };

  const drawBarChart = (doc: any, data: { name: string; value: number }[], x: number, y: number, w: number, h: number) => {
    if (!data.length) return;
    const max = Math.max(...data.map(d => d.value as number), 1);
    const barW = w / data.length * 0.6;
    const gap = w / data.length;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(x, y, x, y + h); // Y axis
    doc.line(x, y + h, x + w, y + h); // X axis
    data.forEach((d, i) => {
      const barH = ((d.value as number) / max) * h;
      const bx = x + i * gap + (gap - barW) / 2;
      const by = y + h - barH;
      const hex = COLORS[i % COLORS.length];
      doc.setFillColor(parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16));
      doc.rect(bx, by, barW, barH, "F");
      doc.setFontSize(6);
      doc.setTextColor(50, 50, 50);
      doc.text(String(d.value), bx + barW / 2, by - 1, { align: "center" });
      const label = d.name.length > 8 ? d.name.slice(0, 8) + "…" : d.name;
      doc.text(label, bx + barW / 2, y + h + 4, { align: "center" });
    });
  };

  // -------- PDF Exports --------

  const getChartInterpretation = (category: string, chartData: any[]) => {
    if (!chartData.length) return "No data available for analysis.";
    const total = chartData.reduce((s: number, i: any) => s + (i.value || i.members || 0), 0);
    switch (category) {
      case "certificates": {
        const p = chartData.find(i => i.name?.toLowerCase() === "pending")?.value || 0;
        const a = chartData.find(i => i.name?.toLowerCase() === "approved")?.value || 0;
        const cl = chartData.find(i => i.name?.toLowerCase() === "claimed")?.value || 0;
        const r = chartData.find(i => i.name?.toLowerCase() === "rejected")?.value || 0;
        return `Total: ${total}\n• Pending: ${p} (${total > 0 ? ((p/total)*100).toFixed(1) : 0}%)\n• Approved: ${a} (${total > 0 ? ((a/total)*100).toFixed(1) : 0}%)\n• Claimed: ${cl} (${total > 0 ? ((cl/total)*100).toFixed(1) : 0}%)\n• Rejected: ${r} (${total > 0 ? ((r/total)*100).toFixed(1) : 0}%)`;
      }
      case "feedback": {
        const p = chartData.find(i => i.name?.toUpperCase() === "PENDING")?.value || 0;
        const ip = chartData.find(i => i.name?.toUpperCase().includes("PROGRESS"))?.value || 0;
        const res = chartData.find(i => i.name?.toUpperCase() === "RESOLVED")?.value || 0;
        return `Total: ${total}\n• Pending: ${p}\n• In Progress: ${ip}\n• Resolved: ${res} (${total > 0 ? ((res/total)*100).toFixed(1) : 0}% resolution rate)`;
      }
      case "residents": return `Total Residents: ${total}\n${chartData.map(i => `• Age ${i.name}: ${i.value} (${total > 0 ? ((i.value/total)*100).toFixed(1) : 0}%)`).join("\n")}`;
      case "gender": return `• Male: ${chartData.find(i=>i.name==="Male")?.value || 0}\n• Female: ${chartData.find(i=>i.name==="Female")?.value || 0}\n• Total: ${total}`;
      case "staff": return `Staff Activity:\n${chartData.map(i => `• ${i.name}: ${i.value}`).join("\n")}`;
      case "announcements": return `Active: ${chartData.find(i=>i.name==="Active")?.value || 0} | Expired: ${chartData.find(i=>i.name==="Expired")?.value || 0}`;
      default: return "";
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 16;

    // Header
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("BARANGAY REPORT SUMMARY", 14, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (dateRange.from || dateRange.to) doc.text(`Period: ${dateRange.from || "Start"} to ${dateRange.to || "Today"}`, 14, 21);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    doc.setTextColor(0, 0, 0);
    y = 38;

    // Stats summary table
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Overview Statistics", 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Category", "Count"]],
      body: Object.entries(stats).filter(([, v]) => typeof v === "number").map(([k, v]) => [k.replace(/^total/i, ""), v]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 38, 38] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Numeric Report
    doc.addPage();
    y = 16;
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("NUMERIC ANALYTICS REPORT", 14, 9);
    doc.setTextColor(0, 0, 0);
    y = 22;

    const numRows = [
      ["Total Residents", numericReport.totalResidents],
      ["Male Residents", numericReport.male],
      ["Female Residents", numericReport.female],
      ["Senior Citizens (60+)", numericReport.seniors],
      ["Youth (0–17)", numericReport.youth],
      ["Young Adults (18–34)", numericReport.youngAdult],
      ["Middle Age (35–59)", numericReport.middleAge],
      ["Total Households", numericReport.totalHouseholds],
      ["Avg. Household Size", numericReport.avgHouseholdSize],
      ["Total Certificate Requests", numericReport.totalCerts],
      ["  Pending Certificates", numericReport.pendingCerts],
      ["  Approved Certificates", numericReport.approvedCerts],
      ["  Claimed Certificates", numericReport.claimedCerts],
      ["  Rejected Certificates", numericReport.rejectedCerts],
      ["Total Complaints (Feedback)", numericReport.totalFeedback],
      ["  Pending Complaints", numericReport.pendingFeedback],
      ["  In Progress Complaints", numericReport.inProgressFeedback],
      ["  Resolved Complaints", numericReport.resolvedFeedback],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: numRows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 38, 38] },
      columnStyles: { 1: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Gender pie chart on same page
    if (y + 60 > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Gender Distribution", 14, y);
    y += 5;
    drawPieChart(doc, [{ name: "Male", value: numericReport.male }, { name: "Female", value: numericReport.female }], 55, y + 25, 22);
    y += 60;

    // Charts page
    const categories: Array<"certificates" | "feedback" | "residents" | "staff" | "announcements"> = ["certificates", "feedback", "residents", "staff", "announcements"];
    for (const cat of categories) {
      const chartData = getChartData(cat);
      if (!chartData.length) continue;

      if (y > 220) { doc.addPage(); y = 20; }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(`${cat.charAt(0).toUpperCase() + cat.slice(1)} Analysis`, 14, y);
      doc.setTextColor(0, 0, 0);
      y += 6;

      // Draw chart
      const isPie = cat === "certificates" || cat === "feedback" || cat === "residents" || cat === "announcements";
      if (isPie) {
        drawPieChart(doc, chartData as { name: string; value: number }[], 50, y + 22, 18);
      } else {
        drawBarChart(doc, chartData as { name: string; value: number }[], 14, y, 90, 35);
      }

      // Interpretation text
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const interp = getChartInterpretation(cat, chartData);
      const lines = doc.splitTextToSize(interp, 90);
      doc.text(lines, 115, y + 4);
      y += isPie ? 55 : 50;
    }

    // Senior citizens list
    doc.addPage();
    y = 16;
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`SENIOR CITIZENS LIST (${seniors.length} records)`, 14, 9);
    doc.setTextColor(0, 0, 0);
    y = 22;

    if (seniors.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["ID", "First Name", "Last Name", "Age", "Gender", "Contact", "Address"]],
        body: seniors.map(r => [
          r.resident_id,
          r.first_name,
          r.last_name,
          getAge(r.birthdate) ?? "N/A",
          r.gender || "N/A",
          r.contact_no || "N/A",
          r.address ? r.address.slice(0, 30) : "N/A",
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [220, 38, 38] },
      });
    } else {
      doc.setFontSize(10);
      doc.text("No senior citizens found in the current data.", 14, y + 8);
    }

    // Gender list
    doc.addPage();
    y = 16;
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`GENDER REPORT — Male: ${maleResidents.length} | Female: ${femaleResidents.length}`, 14, 9);
    doc.setTextColor(0, 0, 0);
    y = 22;

    // Gender pie chart
    drawPieChart(doc, genderChartData, 55, y + 25, 22);
    y += 60;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Male Residents", 14, y); y += 4;
    if (maleResidents.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["ID", "First Name", "Last Name", "Age", "Contact"]],
        body: maleResidents.slice(0, 100).map(r => [r.resident_id, r.first_name, r.last_name, getAge(r.birthdate) ?? "N/A", r.contact_no || "N/A"]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [54, 162, 235] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Female Residents", 14, y); y += 4;
    if (femaleResidents.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["ID", "First Name", "Last Name", "Age", "Contact"]],
        body: femaleResidents.slice(0, 100).map(r => [r.resident_id, r.first_name, r.last_name, getAge(r.birthdate) ?? "N/A", r.contact_no || "N/A"]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [255, 99, 132] },
      });
    }

    doc.save("barangay_comprehensive_report.pdf");
  };

  const handleExportDetailedPDF = () => {
    if (!activeCategory || !details.length) return;
    const doc = new jsPDF();
    let y = 16;

    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Detailed Report`, 14, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (dateRange.from || dateRange.to) doc.text(`Period: ${dateRange.from || "Start"} to ${dateRange.to || "Today"}`, 14, 21);
    doc.text(`Generated: ${new Date().toLocaleString()} | Total: ${details.length}`, 14, 27);
    doc.setTextColor(0, 0, 0);
    y = 38;

    // Chart
    const chartData = getChartData(activeCategory);
    if (chartData.length > 0) {
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("Data Analysis", 14, y); y += 5;

      const isPie = ["certificates","feedback","residents","announcements"].includes(activeCategory);
      if (isPie) {
        drawPieChart(doc, chartData as { name: string; value: number }[], 50, y + 22, 20);
      } else {
        drawBarChart(doc, chartData as { name: string; value: number }[], 14, y, 90, 35);
      }

      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      const interp = getChartInterpretation(activeCategory, chartData);
      const lines = doc.splitTextToSize(interp, 90);
      doc.text(lines, 115, y + 4);
      y += isPie ? 55 : 50;
    }

    // Table
    autoTable(doc, {
      startY: y,
      head: [Object.keys(details[0]).filter(k => !k.startsWith('member_') && !k.startsWith('staff_member_')).map(k => k.replaceAll("_", " ").toUpperCase())],
      body: details.map(d => Object.entries(d).filter(([k]) => !k.startsWith('member_') && !k.startsWith('staff_member_')).map(([k, v]) => {
        if (["created_at","requested_at","approved_at","submitted_at","responded_at","posted_at","expiry_date","birthdate"].includes(k) && v) return new Date(v as string).toLocaleDateString();
        if ((k === "proof_file" || k === "response_proof_file") && v) return "[Image]";
        return String(v ?? '');
      })),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [220, 38, 38] },
    });

    doc.save(`${activeCategory}_detailed_report.pdf`);
  };

  const handleExportSeniorPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("SENIOR CITIZENS REPORT", 14, 13);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Total Senior Citizens: ${seniors.length} | Generated: ${new Date().toLocaleString()}`, 14, 21);
    doc.setTextColor(0, 0, 0);

    // Age distribution of seniors
    const seniorAgeGroups = seniors.reduce((acc: any, r) => {
      const age = getAge(r.birthdate) ?? 0;
      const g = age < 70 ? "60–69" : age < 80 ? "70–79" : age < 90 ? "80–89" : "90+";
      acc[g] = (acc[g] || 0) + 1; return acc;
    }, {});
    drawBarChart(doc, Object.entries(seniorAgeGroups).map(([name, value]) => ({ name, value: value as number })), 14, 38, 90, 35);

    autoTable(doc, {
      startY: 85,
      head: [["ID", "First Name", "Last Name", "Age", "Gender", "Contact", "Address"]],
      body: seniors.map(r => [r.resident_id, r.first_name, r.last_name, getAge(r.birthdate) ?? "N/A", r.gender || "N/A", r.contact_no || "N/A", r.address ? r.address.slice(0, 40) : "N/A"]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
    });
    doc.save("senior_citizens_report.pdf");
  };

  const handleExportGenderPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("GENDER DISTRIBUTION REPORT", 14, 13);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Male: ${maleResidents.length} | Female: ${femaleResidents.length} | Total: ${residents.length}`, 14, 21);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    doc.setTextColor(0, 0, 0);

    drawPieChart(doc, genderChartData, 55, 60, 22);

    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Male Residents", 14, 95);
    autoTable(doc, {
      startY: 100,
      head: [["ID", "First Name", "Last Name", "Age", "Contact"]],
      body: maleResidents.map(r => [r.resident_id, r.first_name, r.last_name, getAge(r.birthdate) ?? "N/A", r.contact_no || "N/A"]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 162, 235] },
    });

    doc.addPage();
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Female Residents", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["ID", "First Name", "Last Name", "Age", "Contact"]],
      body: femaleResidents.map(r => [r.resident_id, r.first_name, r.last_name, getAge(r.birthdate) ?? "N/A", r.contact_no || "N/A"]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 99, 132] },
    });

    doc.save("gender_distribution_report.pdf");
  };

  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ...Object.entries(stats).filter(([, v]) => typeof v === "number").map(([k, v]) => [k.replace(/^total/i, ""), v]),
      [],
      ["Category", "Male", "Female", "Seniors", "Youth"],
      ["Residents", numericReport.male, numericReport.female, numericReport.seniors, numericReport.youth],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "barangay_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) { localStorage.removeItem("token"); router.push("/auth-front/login"); }
  };

  // -------- Special Report Component --------
  const SpecialReportModal = () => {
    const [srSearch, setSrSearch] = useState("");
    let title = "";
    let data: any[] = [];
    let columns: string[] = [];

    if (specialReportType === "senior") {
      title = `Senior Citizens (${seniors.length})`;
      data = seniors.filter(r => `${r.first_name} ${r.last_name}`.toLowerCase().includes(srSearch.toLowerCase()));
      columns = ["ID", "First Name", "Last Name", "Age", "Gender", "Contact", "Address"];
    } else if (specialReportType === "gender") {
      title = `Gender Distribution — Male: ${maleResidents.length} | Female: ${femaleResidents.length}`;
      const gFilter = (r: any) => `${r.first_name} ${r.last_name}`.toLowerCase().includes(srSearch.toLowerCase());
      data = [...maleResidents.filter(gFilter), ...femaleResidents.filter(gFilter)];
      columns = ["ID", "First Name", "Last Name", "Age", "Gender", "Contact"];
    } else if (specialReportType === "numeric") {
      title = "Numeric Analytics Report";
    }

    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-[55]" onClick={() => setShowSpecialReport(false)} />
        <div className="fixed inset-0 flex justify-center items-center z-[60] p-2 sm:p-4 pointer-events-none">
          <div className="bg-white rounded-xl w-full max-w-5xl p-4 sm:p-6 relative max-h-[90vh] overflow-auto pointer-events-auto shadow-2xl">
            <button onClick={() => setShowSpecialReport(false)} className="absolute top-3 right-3 text-gray-600 hover:text-red-700 bg-white rounded-full p-1 shadow z-10">
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pr-8">{title}</h2>

            {specialReportType === "numeric" && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Total Residents", value: numericReport.totalResidents, color: "bg-blue-50 border-blue-200" },
                    { label: "Male", value: numericReport.male, color: "bg-blue-50 border-blue-200" },
                    { label: "Female", value: numericReport.female, color: "bg-pink-50 border-pink-200" },
                    { label: "Senior Citizens", value: numericReport.seniors, color: "bg-orange-50 border-orange-200" },
                    { label: "Youth (0–17)", value: numericReport.youth, color: "bg-green-50 border-green-200" },
                    { label: "Young Adults (18–34)", value: numericReport.youngAdult, color: "bg-purple-50 border-purple-200" },
                    { label: "Middle Age (35–59)", value: numericReport.middleAge, color: "bg-yellow-50 border-yellow-200" },
                    { label: "Total Households", value: numericReport.totalHouseholds, color: "bg-gray-50 border-gray-200" },
                    { label: "Avg Household Size", value: numericReport.avgHouseholdSize, color: "bg-gray-50 border-gray-200" },
                    { label: "Total Cert. Requests", value: numericReport.totalCerts, color: "bg-red-50 border-red-200" },
                    { label: "Pending Certs", value: numericReport.pendingCerts, color: "bg-yellow-50 border-yellow-200" },
                    { label: "Claimed Certs", value: numericReport.claimedCerts, color: "bg-green-50 border-green-200" },
                    { label: "Total Complaints", value: numericReport.totalFeedback, color: "bg-red-50 border-red-200" },
                    { label: "Resolved Complaints", value: numericReport.resolvedFeedback, color: "bg-green-50 border-green-200" },
                    { label: "Pending Complaints", value: numericReport.pendingFeedback, color: "bg-yellow-50 border-yellow-200" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`border rounded-lg p-3 ${color}`}>
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <p className="text-2xl font-bold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-700 mb-2 text-sm">Gender Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={genderChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={e => `${e.name}: ${e.value}`}>
                          {genderChartData.map((_, i) => <Cell key={i} fill={["#36A2EB","#FF6384"][i]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-700 mb-2 text-sm">Age Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={getChartData("residents")}>
                        <XAxis dataKey="name" style={{ fontSize: 11 }} />
                        <YAxis style={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {(specialReportType === "senior" || specialReportType === "gender") && (
              <>
                <div className="flex gap-2 mb-3 flex-wrap">
                  <input type="text" placeholder="Search..." value={srSearch} onChange={e => setSrSearch(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-red-600 focus:border-red-600" />
                  {specialReportType === "senior" && (
                    <button onClick={handleExportSeniorPDF} className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4" /> Export PDF
                    </button>
                  )}
                  {specialReportType === "gender" && (
                    <button onClick={handleExportGenderPDF} className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4" /> Export PDF
                    </button>
                  )}
                </div>

                {specialReportType === "gender" && (
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-3xl font-bold text-blue-700">{maleResidents.length}</p>
                      <p className="text-sm text-gray-600 font-medium">Male Residents</p>
                    </div>
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-center">
                      <p className="text-3xl font-bold text-pink-600">{femaleResidents.length}</p>
                      <p className="text-sm text-gray-600 font-medium">Female Residents</p>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-red-700 text-white">
                      <tr>
                        {(specialReportType === "senior"
                          ? ["ID", "First Name", "Last Name", "Age", "Gender", "Contact", "Address"]
                          : ["ID", "First Name", "Last Name", "Age", "Gender", "Contact"]
                        ).map(col => (
                          <th key={col} className="px-3 py-2 text-left text-xs whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 200).map((r, i) => (
                        <tr key={i} className="border-t hover:bg-red-50">
                          <td className="px-3 py-2 text-xs text-gray-700">{r.resident_id}</td>
                          <td className="px-3 py-2 text-xs text-gray-700">{r.first_name}</td>
                          <td className="px-3 py-2 text-xs text-gray-700">{r.last_name}</td>
                          <td className="px-3 py-2 text-xs text-gray-700 font-medium text-red-700">{getAge(r.birthdate) ?? "N/A"}</td>
                          <td className="px-3 py-2 text-xs text-gray-700">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.gender?.toLowerCase() === "male" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"}`}>
                              {r.gender || "N/A"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700">{r.contact_no || "N/A"}</td>
                          {specialReportType === "senior" && <td className="px-3 py-2 text-xs text-gray-700">{r.address || "N/A"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 200 && <p className="text-xs text-gray-500 mt-2 text-center">Showing first 200 of {data.length}. Export PDF for full list.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  };

  // -------- Render --------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-800 to-black p-2 sm:p-4 flex flex-col md:flex-row gap-2 sm:gap-4">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-16"} bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 m-2 sm:m-0" : "hidden md:flex"}`}>
        <div className="p-4 flex items-center justify-center relative">
          <img src="/niugan-logo.png" alt="Logo" className={`rounded-full object-cover transition-all duration-300 ${sidebarOpen ? "w-24 h-24" : "w-8 h-8"}`} />
          <button onClick={toggleSidebar} className="absolute top-3 right-3 text-black hover:text-red-700 md:hidden"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 mt-6">
          <ul>
            {features.map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <Link href={`/admin-front/${name}`} onClick={() => setActiveItem(name)} className={`relative flex items-center w-full px-4 py-2 group transition-colors duration-200 ${activeItem === name ? "text-red-700 font-semibold" : "text-black hover:text-red-700"}`}>
                  {activeItem === name && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full" />}
                  <Icon className={`w-6 h-6 mr-2 ${activeItem === name ? "text-red-700" : "text-gray-600 group-hover:text-red-700"}`} />
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 text-black hover:text-red-700 transition w-full text-left">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>
        <div className="p-4 hidden md:flex justify-center">
          <button onClick={toggleSidebar} className="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center shadow-sm">
            {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-white/80 z-40 md:hidden" onClick={toggleSidebar} />}

      {/* Main */}
      <div className="flex-1 flex flex-col gap-2 sm:gap-4 overflow-y-auto min-w-0">
        <header className="bg-gray-50 shadow-sm p-3 sm:p-4 flex justify-between items-center rounded-xl text-black">
          <button onClick={toggleSidebar} className="block md:hidden text-black hover:text-red-700 mr-2"><Bars3Icon className="w-6 h-6" /></button>
          <h1 className="text-large font-bold">Manage Reports</h1>
          <div />
        </header>

        <main className="flex-1 bg-white/80 backdrop-blur-md shadow-md rounded-xl p-3 sm:p-4 md:p-6 min-w-0">
          {/* Date Range */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-1">Start Date</label>
                <input type="date" className="w-full rounded-md border border-gray-300 p-2 text-sm text-black focus:border-red-600 focus:ring-red-600" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-1">End Date</label>
                <input type="date" className="w-full rounded-md border border-gray-300 p-2 text-sm text-black focus:border-red-600 focus:ring-red-600" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["today", "this-week", "this-month", "last-month", "year-to-date"].map(p => (
                <button key={p} onClick={() => applyPreset(p)} className="bg-gray-200 hover:bg-gray-300 px-2 sm:px-3 py-1 rounded-lg text-black text-xs sm:text-sm">{p.replaceAll("-", " ")}</button>
              ))}
            </div>
            <button type="button" onClick={fetchStats} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 text-sm">
              <ArrowPathIcon className="w-4 h-4" /> Generate
            </button>
            {lastUpdated && <p className="text-xs text-gray-500">Last updated: {lastUpdated}</p>}
          </div>

          {/* Special Report Quick Actions */}
          {!loading && Object.keys(allCategoryDetails).length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-800 mb-3">Quick Reports</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={() => { setSpecialReportType("numeric"); setShowSpecialReport(true); }}
                  className="flex flex-col items-center gap-1 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-200 rounded-xl p-3 transition"
                >
                  <ChartBarIcon className="w-6 h-6 text-blue-700" />
                  <span className="text-xs font-semibold text-blue-800">Numeric Report</span>
                </button>
                <button
                  onClick={() => { setSpecialReportType("senior"); setShowSpecialReport(true); }}
                  className="flex flex-col items-center gap-1 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:from-orange-100 hover:to-orange-200 rounded-xl p-3 transition"
                >
                  <UsersIcon className="w-6 h-6 text-orange-700" />
                  <span className="text-xs font-semibold text-orange-800">Senior Citizens</span>
                  <span className="text-lg font-bold text-orange-700">{seniors.length}</span>
                </button>
                <button
                  onClick={() => { setSpecialReportType("gender"); setShowSpecialReport(true); }}
                  className="flex flex-col items-center gap-1 bg-gradient-to-br from-pink-50 to-purple-100 border border-pink-200 hover:from-pink-100 hover:to-purple-200 rounded-xl p-3 transition"
                >
                  <UserGroupIcon className="w-6 h-6 text-pink-700" />
                  <span className="text-xs font-semibold text-pink-800">Gender Report</span>
                  <span className="text-xs text-gray-600">M:{maleResidents.length} F:{femaleResidents.length}</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex flex-col items-center gap-1 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:from-red-100 hover:to-red-200 rounded-xl p-3 transition"
                >
                  <DocumentTextIcon className="w-6 h-6 text-red-700" />
                  <span className="text-xs font-semibold text-red-800">Full PDF Report</span>
                  <span className="text-xs text-gray-500">w/ charts</span>
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Loading stats...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              {Object.entries(stats).filter(([, v]) => typeof v === "number").map(([key, value]) => (
                <div key={key} onClick={() => fetchDetails(key.replace(/^total/i, "").toLowerCase())} className="cursor-pointer bg-white shadow-md p-4 sm:p-6 rounded-lg hover:bg-red-50 transition flex flex-col items-start border border-transparent hover:border-red-200">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800">{key.replace(/^total/i, "")}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-red-700 mt-2">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to view details</p>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          {!loading && Object.keys(allCategoryDetails).length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Data Visualizations</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                {/* Gender Chart */}
                {residents.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">Gender Distribution</h3>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center"><p className="text-2xl font-bold text-blue-700">{maleResidents.length}</p><p className="text-xs text-gray-500">Male</p></div>
                      <div className="text-center"><p className="text-2xl font-bold text-pink-600">{femaleResidents.length}</p><p className="text-xs text-gray-500">Female</p></div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={genderChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={e => `${e.name}: ${e.value}`}>
                          <Cell fill="#36A2EB" /><Cell fill="#FF6384" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ color: "black", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Age Distribution */}
                {allCategoryDetails.residents && allCategoryDetails.residents.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">Age Distribution</h3>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">Senior (60+): {seniors.length}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={getChartData('residents')} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={e => `${e.name}: ${e.value}`}>
                          {getChartData('residents').map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ color: "black", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Certificates */}
                {allCategoryDetails.certificates && allCategoryDetails.certificates.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">Certificate Requests Status</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={getChartData('certificates')} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={e => `${e.name}: ${e.value}`}>
                          {getChartData('certificates').map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ color: "black", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Feedback */}
                {allCategoryDetails.feedback && allCategoryDetails.feedback.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">Complaint Status</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={getChartData('feedback')} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={e => `${e.name}: ${e.value}`}>
                          {getChartData('feedback').map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ color: "black", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Households */}
                {allCategoryDetails.households && allCategoryDetails.households.length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">Household Members (Top 10)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={getChartData('households')}>
                        <XAxis dataKey="name" stroke="#000" style={{ fontSize: '11px' }} />
                        <YAxis stroke="#000" style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ backgroundColor: "white", color: "black", fontSize: "12px" }} />
                        <Bar dataKey="members" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Staff */}
                {allCategoryDetails.staff && allCategoryDetails.staff.length > 0 && getChartData('staff').length > 0 && (
                  <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">Staff Performance Metrics</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={getChartData('staff')}>
                        <XAxis dataKey="name" stroke="#000" angle={-30} textAnchor="end" height={80} style={{ fontSize: '10px' }} />
                        <YAxis stroke="#000" style={{ fontSize: '11px' }} />
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
            <button onClick={handleExportPDF} className="bg-red-700 hover:bg-red-800 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto text-sm">
              <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Export Full PDF (w/ Charts)
            </button>
            <button onClick={handleExportCSV} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto text-sm">
              <ClipboardDocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Export CSV
            </button>
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {activeCategory && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl p-4 sm:p-6 relative max-h-[90vh] overflow-auto">
            <button onClick={() => { setActiveCategory(null); setDetails([]); setSearchTerm(""); setCurrentPage(1); }} className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-700 z-10 bg-white rounded-full p-1">
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4 capitalize pr-8">{activeCategory} Details</h2>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="mb-3 sm:mb-4 w-full p-2 border border-gray-300 rounded-md focus:ring-red-600 focus:border-red-600 text-sm" />

            {details.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">No records found.</p>
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-red-700 text-white">
                      <tr>
                        {Object.keys(details[0]).filter(k => !k.startsWith('member_') && !k.startsWith('staff_member_')).map(key => (
                          <th key={key} className="px-3 sm:px-4 py-2 text-left capitalize cursor-pointer hover:bg-red-800 text-xs sm:text-sm whitespace-nowrap" onClick={() => requestSort(key)}>
                            {key.replaceAll("_", " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDetails.map((item, i) => (
                        <tr key={i} className="border-t hover:bg-red-50 transition">
                          {Object.entries(item).filter(([k]) => !k.startsWith('member_') && !k.startsWith('staff_member_')).map(([key, val], j) => (
                            <td key={j} className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700">
                              {key === "head_resident_first_name" && activeCategory === "households" ? (
                                <button onClick={() => fetchHouseholdMembers(item.id)} className="text-blue-600 hover:text-blue-800 underline font-medium">{String(val)} {item.head_resident_last_name}</button>
                              ) : key === "head_staff_first_name" && activeCategory === "households" ? (
                                <button onClick={() => fetchHouseholdMembers(item.id)} className="text-blue-600 hover:text-blue-800 underline font-medium">{String(val)} {item.head_staff_last_name}</button>
                              ) : (key === "proof_file" || key === "response_proof_file") && activeCategory === "feedback" && val ? (
                                <button onClick={() => {
                                  const img = String(val);
                                  let full = img;
                                  if (!img.startsWith('http')) {
                                    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lqbzmhjyzfqtjbzlbdgw.supabase.co';
                                    full = `${base}/storage/v1/object/public/barangay-assets/${img.startsWith('/') ? img.slice(1) : img}`;
                                  }
                                  setSelectedImage(full);
                                  setImageTitle(key === "proof_file" ? "Proof File" : "Response Proof File");
                                  setShowImageModal(true);
                                }} className="text-blue-600 hover:text-blue-800 underline font-medium whitespace-nowrap">View Image</button>
                              ) : key === "member_count" || key === "staff_member_count" ? (
                                <span className="font-semibold text-red-700">{String(val)}</span>
                              ) : key === "gender" ? (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${String(val).toLowerCase() === "male" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"}`}>{String(val)}</span>
                              ) : ["created_at","requested_at","approved_at","submitted_at","responded_at","posted_at","expiry_date","birthdate"].includes(key) ? (
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

                <div className="flex justify-between mt-3 sm:mt-4 items-center text-sm">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm" disabled={currentPage === 1}>Prev</button>
                  <p className="text-xs sm:text-sm">Page {currentPage} of {totalPages}</p>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm" disabled={currentPage === totalPages}>Next</button>
                </div>

                <button onClick={handleExportDetailedPDF} className="mt-3 sm:mt-4 bg-red-700 hover:bg-red-800 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto text-sm">
                  <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Export Detailed PDF (w/ Chart)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Household Modal */}
      {showHouseholdModal && selectedHousehold && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[65]" onClick={() => { setShowHouseholdModal(false); setSelectedHousehold(null); setHouseholdMembers([]); }} />
          <div className="fixed inset-0 flex justify-center items-center z-[70] p-2 sm:p-4 pointer-events-none">
            <div className="bg-white rounded-xl w-full max-w-4xl p-4 sm:p-6 relative max-h-[90vh] overflow-auto pointer-events-auto shadow-2xl">
              <button onClick={() => { setShowHouseholdModal(false); setSelectedHousehold(null); setHouseholdMembers([]); }} className="absolute top-2 right-2 text-gray-600 hover:text-red-700 bg-white rounded-full p-1">
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-semibold text-black mb-4 pr-8">Household #{selectedHousehold.id} Members</h2>
              <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-gray-50 rounded-lg border border-red-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">Household Head</h3>
                  {selectedHousehold.headResident && <p className="text-sm">{selectedHousehold.headResident.first_name} {selectedHousehold.headResident.last_name} <span className="text-xs px-2 py-0.5 bg-blue-100 rounded ml-1">(Resident)</span></p>}
                  {selectedHousehold.headStaff && <p className="text-sm">{selectedHousehold.headStaff.first_name} {selectedHousehold.headStaff.last_name} <span className="text-xs px-2 py-0.5 bg-green-100 rounded ml-1">(Staff)</span></p>}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">Statistics</h3>
                  <p className="text-sm">Total: {householdMembers.length} | Residents: {householdMembers.filter(m => m.resident_id).length} | Staff: {householdMembers.filter(m => m.staff_id).length}</p>
                </div>
              </div>
              {householdMembers.length === 0 ? <p className="text-center text-gray-500 py-6 text-sm">No members found.</p> : (
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-red-700 text-white">
                    <tr>{["ID","Name","Type","Gender","Contact"].map(h => <th key={h} className="px-4 py-2 text-left text-xs">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {householdMembers.map((m, i) => (
                      <tr key={i} className="border-t hover:bg-red-50">
                        <td className="px-4 py-2 text-xs text-gray-700">{m.resident_id || m.staff_id}</td>
                        <td className="px-4 py-2 text-xs text-gray-700">{m.first_name} {m.last_name}</td>
                        <td className="px-4 py-2 text-xs"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${m.resident_id ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{m.resident_id ? 'Resident' : 'Staff'}</span></td>
                        <td className="px-4 py-2 text-xs text-gray-700">{m.gender || 'N/A'}</td>
                        <td className="px-4 py-2 text-xs text-gray-700">{m.contact_no || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[75]" onClick={() => { setShowImageModal(false); setSelectedImage(""); setImageTitle(""); }} />
          <div className="fixed inset-0 flex justify-center items-center z-[80] p-4 pointer-events-none">
            <div className="bg-white rounded-xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-auto pointer-events-auto shadow-2xl">
              <button onClick={() => { setShowImageModal(false); setSelectedImage(""); setImageTitle(""); }} className="absolute top-3 right-3 text-gray-600 hover:text-red-700 bg-white rounded-full p-2 shadow-md">
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-semibold text-black mb-4 pr-10">{imageTitle}</h2>
              <div className="flex justify-center">
                <img src={selectedImage} alt={imageTitle} className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%236b7280">Image not available</text></svg>'; }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Special Report Modal */}
      {showSpecialReport && specialReportType && <SpecialReportModal />}
    </div>
  );
}