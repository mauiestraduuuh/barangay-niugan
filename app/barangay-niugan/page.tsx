"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IdentificationIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  DocumentCheckIcon,
  ListBulletIcon,
  QrCodeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

// ─── CITIZEN'S CHARTER DATA ──────────────────────────────────────────────────
const CHARTER_SERVICES = [
  {
    id: 1,
    title: "Barangay Clearance",
    description:
      "Opisyal na patunay na ikaw ay isang mabuting mamamayan ng Barangay Niugan, Cabuyao, Laguna.",
    steps: [
      "Mag-log in sa sistema at pumunta sa Certificate Requests.",
      "Pindutin ang 'Request Certificate' at piliin ang 'Barangay Clearance'.",
      "Ilagay ang layunin ng iyong kahilingan at isumite.",
      "Hintayin ang pag-apruba ng Staff o Admin (makatatanggap ka ng notification).",
      "Personal na i-claim ang sertipiko sa Barangay Hall gamit ang iyong Claim Code at Pick-up Schedule.",
    ],
    documents: [
      "Valid Government-issued ID (1 photocopy)",
      "Proof of Residency (utility bill, lease contract, o deed of sale)",
      "2x2 ID Photo (2 kopya)",
      "Registered Barangay Account (para sa online request)",
    ],
    fee: "₱50.00",
    processingTime: "1–3 araw na trabaho",
    officer: "Barangay Staff / Barangay Admin / Barangay Captain",
  },
  {
    id: 2,
    title: "Certificate of Indigency",
    description:
      "Para sa mga mamamayang nangangailangan ng tulong pinansyal, medikal, o legal na tulong.",
    steps: [
      "Mag-log in sa sistema at pumunta sa Certificate Requests.",
      "Pindutin ang 'Request Certificate' at piliin ang 'Certificate of Indigency'.",
      "Ilagay ang layunin ng iyong kahilingan (hal. medikal, scholarship, legal).",
      "Isumite ang kahilingan at hintayin ang pag-apruba ng Admin.",
      "Personal na i-claim ang sertipiko sa Barangay Hall gamit ang Claim Code.",
    ],
    documents: [
      "Valid Government-issued ID",
      "Proof of Residency",
      "Referral letter mula sa ospital, paaralan, o legal na opisina (kung mayroon)",
      "Registered Barangay Account",
    ],
    fee: "Libre (Free)",
    processingTime: "1–3 araw na trabaho",
    officer: "Barangay Staff / Barangay Admin",
  },
  {
    id: 3,
    title: "Barangay Permit",
    description:
      "Kinakailangan para sa pagpapatakbo ng negosyo o aktibidad sa loob ng Barangay Niugan.",
    steps: [
      "Mag-log in sa sistema at pumunta sa Certificate Requests.",
      "Pindutin ang 'Request Certificate' at piliin ang 'Barangay Permit'.",
      "Ilagay ang layunin ng iyong kahilingan at mga detalye ng negosyo.",
      "Isumite ang kahilingan at hintayin ang inspeksyon at pag-apruba ng Admin.",
      "Personal na i-claim ang permit sa Barangay Hall gamit ang Claim Code.",
    ],
    documents: [
      "DTI/SEC/CDA Registration (para sa negosyo)",
      "Lease Contract o Título ng Lupa",
      "Cedula (Community Tax Certificate)",
      "Valid Government-issued ID ng May-ari",
      "Registered Barangay Account",
    ],
    fee: "₱200.00 – ₱500.00 (depende sa uri ng aktibidad/negosyo)",
    processingTime: "3–5 araw na trabaho",
    officer: "Barangay Staff / Barangay Admin / Barangay Captain",
  },
  {
    id: 4,
    title: "Barangay Digital ID",
    description:
      "Digital na pagkakakilanlan ng mamamayan ng Barangay Niugan na may kasamang natatanging QR code para sa mabilis na pag-verify.",
    steps: [
      "Pumunta sa Registration Page at punan ang personal na impormasyon.",
      "Isumite ang iyong kahilingan at makatanggap ng Reference Number.",
      "I-check ang status ng iyong registration sa Status Tracker gamit ang Reference Number.",
      "Kapag naaprubahan, makatanggap ng username at paunang password.",
      "Mag-log in at pumunta sa Digital ID page para ma-download ang iyong ID.",
    ],
    documents: [
      "Birth Certificate (PSA)",
      "Proof of Residency (utility bill o lease contract)",
      "Recent Profile Photo (JPEG o PNG format lamang)",
      "Valid Government-issued ID",
    ],
    fee: "Libre (Free)",
    processingTime: "3–5 araw na trabaho (pagkatapos ng pag-apruba ng registration)",
    officer: "Barangay Staff / Barangay Admin",
  },
  {
    id: 5,
    title: "Pagsumite ng Reklamo / Complaint",
    description:
      "Para sa mga mamamayang nais mag-ulat ng mga alalahanin sa komunidad tulad ng kalsada, kaligtasan, o kapaligiran.",
    steps: [
      "Mag-log in sa sistema at pumunta sa Complaints Management.",
      "Piliin ang kaugnay na grupo ng reklamo (hal. kalsada, kaligtasan, kapaligiran).",
      "Pumili sa mga pre-defined na opsyon at ilagay ang detalye ng reklamo (Ingles o Filipino).",
      "Isumite ang reklamo at makatanggap ng confirmation.",
      "Subaybayan ang status ng iyong reklamo sa ilalim ng History Tab.",
    ],
    documents: [
      "Registered Barangay Account (login required)",
      "Mga ebidensya (litrato o dokumento) kung mayroon — JPEG o PNG format",
      "Detalye ng insidente (petsa, lugar, paglalarawan)",
    ],
    fee: "Libre (Free)",
    processingTime: "Depende sa uri ng reklamo; sinusubaybayan ng Admin",
    officer: "Barangay Admin / Barangay Captain",
  },
  {
    id: 6,
    title: "Pagrehistro ng Mamamayan",
    description:
      "Proseso ng paglikha ng account sa sistema para ma-access ang lahat ng digital na serbisyo ng Barangay Niugan.",
    steps: [
      "Pumunta sa Registration Page at punan ang personal na impormasyon.",
      "Isumite ang iyong kahilingan at makatanggap ng Reference Number.",
      "I-check ang status ng iyong registration sa Status Tracker gamit ang Reference Number.",
      "Kapag naaprubahan, makatanggap ng username at paunang password.",
      "Mag-log in gamit ang ibinigay na credentials at i-update ang iyong profile.",
    ],
    documents: [
      "Buong Pangalan at Petsa ng Kapanganakan",
      "Kasalukuyang Tirahan sa Barangay Niugan, Cabuyao, Laguna",
      "Contact Number at Email Address",
      "Profile Photo (JPEG o PNG format)",
      "Household Information (para sa mga miyembro ng pamilya)",
    ],
    fee: "Libre (Free)",
    processingTime: "1–5 araw na trabaho (nakasalalay sa pag-apruba ng Staff/Admin)",
    officer: "Barangay Staff / Barangay Admin",
  },
];

// ─── SYSTEM FEATURES ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: IdentificationIcon,
    title: "Digital Barangay ID",
    desc: "QR code-enabled digital ID para sa mabilis at secure na pag-verify ng pagkakakilanlan at residency.",
  },
  {
    icon: DocumentTextIcon,
    title: "Online Certificate Request",
    desc: "Mag-request ng Barangay Clearance, Certificate of Indigency, at Barangay Permit kahit saan, kahit kailan.",
  },
  {
    icon: ChatBubbleLeftEllipsisIcon,
    title: "Complaints Module",
    desc: "Mag-ulat ng mga alalahanin sa komunidad sa Filipino o Ingles at subaybayan ang status ng iyong reklamo.",
  },
  {
    icon: MegaphoneIcon,
    title: "Mga Anunsyo",
    desc: "Manatiling updated sa mga pinakabagong balita, aktibidad, at abiso ng Barangay Niugan.",
  },
  {
    icon: ChartBarIcon,
    title: "Analytics Dashboard",
    desc: "Para sa mga opisyal: real-time na visualisasyon ng demographic data at mga serbisyong nagamit.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Role-Based Access Control",
    desc: "Seguridad ng datos sa pamamagitan ng hiwalay na access para sa Resident, Staff, at Admin.",
  },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface CharterService {
  id: number;
  title: string;
  description: string;
  steps: string[];
  documents: string[];
  fee: string;
  processingTime: string;
  officer: string;
}

// ─── SERVICE CARD (ACCORDION) ─────────────────────────────────────────────────
function ServiceCard({ service }: { service: CharterService }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
        open
          ? "border-red-400/70 bg-white/10 shadow-red-500/20 shadow-xl"
          : "border-red-500/30 bg-white/5 hover:border-red-500/60 hover:bg-white/8"
      }`}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm flex-shrink-0">
            {service.id}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-red-300 transition-colors">
              {service.title}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{service.description}</p>
          </div>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-red-400 flex-shrink-0 ml-4 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-red-500/20 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Steps */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ListBulletIcon className="w-5 h-5 text-red-400" />
              <h4 className="font-semibold text-red-300 text-sm uppercase tracking-wider">
                Hakbang-hakbang na Proseso
              </h4>
            </div>
            <ol className="space-y-2">
              {service.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-300">
                  <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Documents + Meta */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DocumentCheckIcon className="w-5 h-5 text-red-400" />
                <h4 className="font-semibold text-red-300 text-sm uppercase tracking-wider">
                  Mga Kinakailangang Dokumento
                </h4>
              </div>
              <ul className="space-y-1.5">
                {service.documents.map((doc, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-red-400 mt-0.5">•</span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3">
                <CurrencyDollarIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Bayad / Fee</p>
                  <p className="text-sm text-white font-semibold">{service.fee}</p>
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Oras ng Pagproseso</p>
                  <p className="text-sm text-white font-semibold">{service.processingTime}</p>
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Responsableng Opisyal</p>
                  <p className="text-sm text-white font-semibold">{service.officer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavbarVisible(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900 to-black text-white relative font-sans">
      {/* Decorative backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-black/20 animate-pulse pointer-events-none -z-20" />
      <div className="absolute top-10 left-10 w-32 h-32 bg-red-500/20 rounded-full blur-xl animate-bounce pointer-events-none -z-20" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-bounce delay-1000 pointer-events-none -z-20" />

      {/* ── NAVIGATION ───────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out
          ${navbarVisible ? "bg-black/70 backdrop-blur-md border-b border-red-500/30 shadow-lg" : "bg-transparent"}
        `}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center z-50">
              <h1 className="text-2xl font-bold text-red-400 tracking-wide">Barangay Niugan</h1>
            </div>
            <div className="hidden md:flex space-x-8 z-50">
              <Link href="/auth-front/login" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">Mag-Log In</Link>
              <Link href="/auth-front/register" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">Magparehistro</Link>
              <Link href="/auth-front/no-email" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">Suriin ang Status</Link>
              <a href="#citizen-charter" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">Citizen's Charter</a>
            </div>
            <div className="md:hidden z-50">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 hover:text-red-400 transition-colors duration-300 p-2"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden z-50">
            <div className="absolute left-0 right-0 bg-black/90 backdrop-blur-md border-t border-red-500/30 py-4">
              <div className="space-y-2 max-w-md mx-auto px-4">
                <Link href="/auth-front/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">Mag-Log In</Link>
                <Link href="/auth-front/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">Magparehistro</Link>
                <Link href="/auth-front/no-email" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">Suriin ang Status</Link>
                <a href="#citizen-charter" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">Citizen's Charter</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center py-32 px-4 overflow-visible">
        <div className="absolute top-0 left-0 w-72 h-72 bg-red-900 rounded-full opacity-20 animate-pulse-slow pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-800 rounded-full opacity-15 animate-pulse-slow pointer-events-none -z-10" />

        <Image
          src="/logo.png"
          alt="Barangay Niugan Logo"
          width={260}
          height={260}
          className="mb-10 rounded-full object-cover aspect-square shadow-[0_0_25px_rgba(255,255,255,0.25)] border-4 border-white"
        />

        <p className="text-sm uppercase tracking-[0.3em] text-red-400 font-semibold mb-3">
          Cabuyao, Laguna · E-Governance System
        </p>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg animate-fade-in bg-gradient-to-r from-red-400 to-white bg-clip-text text-transparent">
          Welcome to Barangay Niugan
        </h1>

        <p className="text-lg md:text-2xl mb-10 max-w-2xl drop-shadow-md animate-fade-in delay-200 text-gray-300">
          Ang opisyal na digital na pinto ng Barangay Niugan — mabilis, maaasahan, at bukas para sa lahat ng mamamayan.
        </p>

        <div className="flex flex-col md:flex-row gap-4 z-20">
          <Link href="/auth-front/login" className="inline-block bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold px-8 py-4 rounded-full shadow-2xl hover:scale-105 hover:shadow-red-500/50 transition-all duration-300">
            Mag-Log In
          </Link>
          <Link href="/auth-front/register" className="inline-block border border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-red-700 transition-all duration-300">
            Magparehistro
          </Link>
          <Link href="/auth-front/no-email" className="inline-block border border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-red-700 transition-all duration-300">
            Suriin ang Status
          </Link>
        </div>

        {/* Quick stat chips */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {[
            { label: "Digital ID", sub: "QR Code-enabled" },
            { label: "3 Sertipiko", sub: "Online request" },
            { label: "Reklamo", sub: "Real-time tracking" },
            { label: "ISO 25010", sub: "Quality certified" },
          ].map(({ label, sub }) => (
            <div key={label} className="bg-white/5 border border-red-500/30 rounded-full px-5 py-2 text-center">
              <span className="text-white text-sm font-semibold">{label}</span>
              <span className="text-gray-400 text-xs ml-2">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-black/50 backdrop-blur-lg text-center px-6 border-t border-red-500/20">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Tungkol sa Barangay Niugan</h2>
        <p className="text-gray-400 mb-10 text-lg">Cabuyao, Laguna</p>

        <div className="max-w-4xl mx-auto text-left space-y-6">
          <div className="bg-white/10 backdrop-blur-lg border border-red-500/50 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-semibold mb-3 text-red-400">Pananaw</h3>
            <p className="text-lg leading-relaxed text-gray-300">
              "Isang Barangay na maunlad at mapayapa, na pinamumunuan at pinaninirahan ng mga mamamayang may pananalig at takot sa Diyos,
              tumatalima sa umiiral na batas, nagtitiwala sa lakas ng pagkakaisa, at kumakalinga sa kalikasan."
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-red-500/50 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-semibold mb-3 text-red-400">Misyon</h3>
            <p className="text-lg leading-relaxed text-gray-300">
              "Maging isang Barangay na maunlad at mapayapa, na pinamumunuan at pinaninirahan ng mga mamamayang may pananalig at takot sa Diyos,
              tumatalima sa umiiral na batas, nagtitiwala sa lakas ng pagkakaisa, at kumakalinga sa kalikasan."
            </p>
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 text-sm text-gray-400 text-center">
            Ang sistemang ito ay binuo ng mga mag-aaral ng{" "}
            <strong className="text-white">Technological University of the Philippines</strong> bilang bahagi ng kanilang pananaliksik — isang web-based e-Governance platform na gumagamit ng{" "}
            <strong className="text-white">Next.js, Node.js, Tailwind CSS, at PostgreSQL (Supabase)</strong>, sinuri ayon sa pamantayan ng{" "}
            <strong className="text-white">ISO 25010</strong>.
          </div>
        </div>
      </section>

      {/* ── SYSTEM FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-black/30 backdrop-blur-lg text-center border-t border-red-500/20 px-4">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Mga Tampok ng Sistema</h2>
        <p className="text-gray-400 mb-12 text-lg max-w-2xl mx-auto">
          Dinisenyo para sa tatlong uri ng gumagamit:{" "}
          <span className="text-red-300 font-semibold">Resident</span>,{" "}
          <span className="text-red-300 font-semibold">Staff</span>, at{" "}
          <span className="text-red-300 font-semibold">Admin</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-lg border border-red-500/50 rounded-2xl p-8 shadow-2xl hover:bg-white/20 hover:border-red-400/70 hover:scale-105 hover:shadow-red-500/20 transition-all duration-300 flex flex-col items-center text-center"
            >
              <feature.icon className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-black/50 backdrop-blur-lg text-center border-t border-red-500/20 px-4">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Paano Gumagana?</h2>
        <p className="text-gray-400 mb-12 text-lg">Tatlong simpleng hakbang para magsimula</p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-4xl mx-auto">
          {[
            {
              step: "01",
              title: "Magparehistro",
              desc: "Lumikha ng account sa sistema gamit ang iyong personal na impormasyon at hintayin ang pag-apruba.",
              href: "/auth-front/register",
            },
            {
              step: "02",
              title: "Mag-Log In",
              desc: "Gamitin ang iyong naaprubahang username at password para ma-access ang iyong dashboard.",
              href: "/auth-front/login",
            },
            {
              step: "03",
              title: "Gamitin ang Serbisyo",
              desc: "Mag-request ng sertipiko, i-download ang Digital ID, o mag-file ng reklamo — lahat online.",
              href: "/auth-front/login",
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-4 flex-1">
              <div className="bg-white/5 border border-red-500/40 rounded-2xl p-6 text-center w-full hover:border-red-400/70 hover:bg-white/10 transition-all duration-300">
                <div className="text-4xl font-black text-red-500/40 mb-2">{item.step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
                <Link href={item.href} className="inline-flex items-center gap-1 mt-4 text-red-400 text-sm font-semibold hover:text-red-300 transition-colors">
                  Pumunta <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>
              {i < 2 && (
                <ArrowRightIcon className="w-6 h-6 text-red-500/40 hidden md:block flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CITIZEN'S CHARTER ─────────────────────────────────────────────────── */}
      <section id="citizen-charter" className="py-24 bg-black/60 backdrop-blur-xl border-t border-red-500/20 px-4">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="inline-block bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              RA 11032 · Ease of Doing Business Act
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Citizen's Charter</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Ang opisyal na listahan ng mga serbisyo ng Barangay Niugan Management System — kasama ang mga hakbang, kinakailangang dokumento, bayad, oras ng pagproseso, at responsableng opisyal.
            </p>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { icon: ListBulletIcon, label: "Hakbang-hakbang na Proseso" },
              { icon: DocumentCheckIcon, label: "Mga Kinakailangang Dokumento" },
              { icon: CurrencyDollarIcon, label: "Bayad / Fees" },
              { icon: UserIcon, label: "Responsableng Opisyal" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 border border-red-500/20 rounded-xl px-4 py-3">
                <Icon className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Online claim note */}
          <div className="mb-8 bg-red-500/10 border border-red-400/30 rounded-2xl p-4 text-sm text-gray-300 flex gap-3 items-start">
            <QrCodeIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Paalala:</strong> Ang lahat ng sertipiko ay maaaring i-request{" "}
              <strong className="text-white">online</strong> sa pamamagitan ng sistema, ngunit kailangang{" "}
              <strong className="text-white">personal na i-claim</strong> sa Barangay Hall gamit ang inyong{" "}
              <em>Claim Code</em> at <em>Pick-up Schedule</em>. Ang pag-upload ng mga dokumento ay limitado sa{" "}
              <strong className="text-white">JPEG o PNG</strong> na format lamang.
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-4">
            {CHARTER_SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          <div className="mt-10 bg-white/5 border border-red-500/20 rounded-2xl p-5 text-sm text-gray-400 text-center">
            <strong className="text-red-300">Legal Basis:</strong> Ang lahat ng serbisyo ay alinsunod sa{" "}
            <strong className="text-white">Republic Act No. 11032</strong> (Ease of Doing Business and Efficient Government Service Delivery Act of 2018) at{" "}
            <strong className="text-white">Republic Act No. 7160</strong> (Local Government Code of the Philippines).
            <br />
            Para sa mga katanungan, makipag-ugnayan sa Barangay Hall ng Barangay Niugan, Cabuyao, Laguna sa opisyal na oras ng trabaho:{" "}
            <strong className="text-white">Lunes – Biyernes, 8:00 AM – 5:00 PM</strong>.
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="relative z-20 bg-gradient-to-br from-red-700 via-red-800 to-black text-white py-24 text-center border-t border-red-500/20">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
          Handa ka na bang magsimula?
        </h2>
        <p className="mb-10 drop-shadow-md text-gray-300 max-w-xl mx-auto">
          Magparehistro ngayon at i-enjoy ang mabilis, transparent, at digital na serbisyo ng Barangay Niugan.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6">
          <Link href="/auth-front/register" className="self-center w-fit inline-block bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold px-8 py-4 rounded-full shadow-2xl hover:scale-105 hover:shadow-red-500/50 transition-all duration-300">
            Magparehistro
          </Link>
          <Link href="/auth-front/login" className="self-center w-fit inline-block border border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-red-700 transition-all duration-300">
            Mag-Log In
          </Link>
          <a href="#citizen-charter" className="self-center w-fit inline-block border border-red-400/60 text-red-300 font-semibold px-8 py-4 rounded-full hover:bg-red-400/10 transition-all duration-300">
            Tingnan ang Charter
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="bg-black text-white py-8 border-t border-red-500/20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Barangay Niugan Management System. All rights reserved.</p>
          <p>Barangay Niugan, Cabuyao, Laguna · Lunes–Biyernes 8AM–5PM</p>
          <p className="text-xs">Developed by TUP Computer Studies Dept. · ISO 25010</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s ease forwards; }
        .animate-fade-in.delay-200 { animation-delay: 0.2s; }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}