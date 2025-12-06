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
} from "@heroicons/react/24/outline";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar background when scrolled past the hero (approx 300px)
      if (window.scrollY > 300) {
        setNavbarVisible(true);
      } else {
        setNavbarVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900 to-black text-white relative font-sans">
      {/* Decorative backgrounds (behind everything) */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-black/20 animate-pulse pointer-events-none -z-20" />
      <div className="absolute top-10 left-10 w-32 h-32 bg-red-500/20 rounded-full blur-xl animate-bounce pointer-events-none -z-20" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-bounce delay-1000 pointer-events-none -z-20" />

      {/* Navigation (always rendered so mobile can open menu before scroll) */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out
          ${navbarVisible ? "bg-black/70 backdrop-blur-md border-b border-red-500/30 shadow-lg" : "bg-transparent"}
        `}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center z-50">
              <h1 className="text-2xl font-bold text-red-400 tracking-wide">Barangay Niugan</h1>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex space-x-10 z-50">
              <Link href="/auth-front/login" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">
                Mag-Log In
              </Link>
              <Link href="/auth-front/register" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">
                Magparehistro
              </Link>
              <Link href="/auth-front/no-email" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">
                Suriin ang Status
              </Link>
            </div>

            {/* Mobile Menu Button */}
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

        {/* Mobile menu overlay (separate layer and full width) */}
        {mobileMenuOpen && (
          <div className="md:hidden z-50">
            <div className="absolute left-0 right-0 bg-black/90 backdrop-blur-md border-t border-red-500/30 py-4">
              <div className="space-y-2 max-w-md mx-auto px-4">
                <Link href="/auth-front/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">
                  Mag-Log In
                </Link>
                <Link href="/auth-front/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">
                  Magparehistro
                </Link>
                <Link href="/auth-front/no-email" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">
                  Suriin ang Status
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center py-32 px-4 overflow-visible">
        {/* floating shapes inside hero (behind content and pointer-events disabled) */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-red-900 rounded-full opacity-20 animate-pulse-slow pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-800 rounded-full opacity-15 animate-pulse-slow pointer-events-none -z-10" />

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Barangay Niugan Logo"
          width={260}
          height={260}
          className="mb-10 rounded-full object-cover aspect-square shadow-[0_0_25px_rgba(255,255,255,0.25)] border-4 border-white"
        />

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg animate-fade-in bg-gradient-to-r from-red-400 to-white bg-clip-text text-transparent">
          Welcome to Barangay Niugan
        </h1>

        <p className="text-lg md:text-2xl mb-10 max-w-2xl drop-shadow-md animate-fade-in delay-200 text-gray-300">
          Ang opisyal na digital na pinto ng Barangay Niugan — mabilis, maaasahan, at bukas para sa lahat ng mamamayan.
        </p>

        <div className="flex flex-col md:flex-row gap-4 z-20">
          <Link
            href="/auth-front/login"
            className="inline-block bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold px-8 py-4 rounded-full shadow-2xl hover:scale-105 hover:shadow-red-500/50 transition-all duration-300"
          >
            Mag-Log In
          </Link>

          <Link
            href="/auth-front/register"
            className="inline-block border border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-red-700 transition-all duration-300"
          >
            Magparehistro
          </Link>

          <Link
            href="/auth-front/no-email"
            className="inline-block border border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-red-700 transition-all duration-300"
          >
            Suriin ang Status
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="py-24 bg-black/50 backdrop-blur-lg text-center px-6 border-t border-red-500/20">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">Tungkol sa Barangay Niugan</h2>

        <div className="max-w-4xl mx-auto text-left space-y-10">
          <div className="bg-white/10 backdrop-blur-lg border border-red-500/50 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-semibold mb-3 text-red-400">Pananaw</h3>
            <p className="text-lg leading-relaxed text-gray-300">
              "Isang Barangay na maunlad at mapayapa, na pinamumunuan at
              pinaninirahan ng mga mamamayang may pananalig at takot sa Diyos,
              tumatalima sa umiiral na batas, nagtitiwala sa lakas ng
              pagkakaisa, at kumakalinga sa kalikasan."
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-red-500/50 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-semibold mb-3 text-red-400">Misyon</h3>
            <p className="text-lg leading-relaxed text-gray-300">
              "Maging isang Barangay na maunlad at mapayapa, na pinamumunuan at
              pinaninirahan ng mga mamamayang may pananalig at takot sa Diyos,
              tumatalima sa umiiral na batas, nagtitiwala sa lakas ng
              pagkakaisa, at kumakalinga sa kalikasan."
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-black/30 backdrop-blur-lg text-center border-t border-red-500/20">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">
          Serbisyo ng Barangay
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-4">
          {[
            { icon: IdentificationIcon, title: "Digital ID", desc: "Makuha ang iyong Barangay Digital ID anumang oras, kahit saan." },
            { icon: DocumentTextIcon, title: "Mga Sertipiko", desc: "Mag-request ng Barangay Certificates nang mabilis at online." },
            { icon: ChatBubbleLeftEllipsisIcon, title: "Reklamo at Puna", desc: "Ipadala ang iyong reklamo o puna at makatanggap ng tugon." },
          ].map((service, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-lg border border-red-500/50 rounded-2xl p-10 shadow-2xl hover:bg-white/20 hover:border-red-400/70 hover:scale-105 hover:shadow-red-500/20 transition-all duration-300 flex flex-col items-center"
            >
              <service.icon className="w-14 h-14 text-red-400 mb-4 animate-pulse" />
              <h3 className="text-2xl font-semibold mb-2 text-white">{service.title}</h3>
              <p className="text-gray-300">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

        {/* CTA */}
        <section className="relative z-20 bg-gradient-to-br from-red-700 via-red-800 to-black text-white py-24 text-center border-t border-red-500/20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
            Handa ka na bang magsimula?
          </h2>

          <p className="mb-10 drop-shadow-md text-gray-300">
            Magparehistro o mag-log in upang magamit ang mga serbisyo ng barangay.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6">
            <Link
              href="/auth-front/register"
              className="self-center w-fit md:w-auto
                        inline-block bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold
                        text-sm md:text-base
                        px-6 py-3 md:px-8 md:py-4
                        rounded-full shadow-2xl 
                        hover:scale-105 hover:shadow-red-500/50 transition-all duration-300"
            >
              Magparehistro
            </Link>

            <Link
              href="/auth-front/login"
              className="self-center w-fit md:w-auto
                        inline-block border border-white text-white font-semibold
                        text-sm md:text-base
                        px-6 py-3 md:px-8 md:py-4
                        rounded-full 
                        hover:bg-white hover:text-red-700 transition-all duration-300"
            >
              Mag-Log In
            </Link>
          </div>
        </section>

      {/* Footer */}
      <footer className="bg-black text-white py-6 text-center border-t border-red-500/20">
        <p>© {new Date().getFullYear()} Barangay Niugan. All rights reserved.</p>
      </footer>

      {/* Inline Animations */}
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
