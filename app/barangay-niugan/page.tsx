"use client";

import Link from "next/link";
import Image from "next/image";
import {
  IdentificationIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/solid";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col font-sans">

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-32 px-4 bg-gradient-to-br from-red-700 via-red-800 to-black text-white overflow-hidden">
        
        {/* Floating shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-red-900 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-800 rounded-full opacity-15 animate-pulse-slow"></div>

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Barangay Niugan Logo"
          width={260}
          height={260}
          className="mb-10 rounded-full object-cover aspect-square shadow-[0_0_25px_rgba(255,255,255,0.25)] border-4 border-white"
        />

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg animate-fade-in">
          Welcome to Barangay Niugan
        </h1>

        <p className="text-lg md:text-2xl mb-10 max-w-2xl drop-shadow-md animate-fade-in delay-200">
          Ang opisyal na digital na pinto ng Barangay Niugan — mabilis, maaasahan, at bukas para sa lahat ng mamamayan.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <Link
            href="/auth-front/login"
            className="bg-white text-red-700 font-semibold px-8 py-4 rounded-full shadow-2xl hover:scale-105 hover:shadow-3xl transition-all duration-300"
          >
            Mag-Log In
          </Link>

          <Link
            href="/auth-front/register"
            className="border border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-red-700 transition-all duration-300"
          >
            Magparehistro
          </Link>

          <Link
            href="/auth-front/no-email"
            className="border border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-red-700 transition-all duration-300"
          >
            Suriin ang Status
          </Link>
        </div>
      </section>

      {/* About Barangay */}
      <section className="py-24 bg-gray-50 text-black text-center px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">Tungkol sa Barangay Niugan</h2>

        <div className="max-w-4xl mx-auto text-left space-y-10">
          {/* Pananaw */}
          <div>
            <h3 className="text-2xl font-semibold mb-3">Pananaw</h3>
            <p className="text-lg leading-relaxed text-gray-800">
              “Isang Barangay na maunlad at mapayapa, na pinamumunuan at
              pinaninirahan ng mga mamamayang may pananalig at takot sa Diyos,
              tumatalima sa umiiral na batas, nagtitiwala sa lakas ng
              pagkakaisa, at kumakalinga sa kalikasan.”
            </p>
          </div>

          {/* Misyon */}
          <div>
            <h3 className="text-2xl font-semibold mb-3">Misyon</h3>
            <p className="text-lg leading-relaxed text-gray-800">
              “Maging isang Barangay na maunlad at mapayapa, na pinamumunuan at
              pinaninirahan ng mga mamamayang may pananalig at takot sa Diyos,
              tumatalima sa umiiral na batas, nagtitiwala sa lakas ng
              pagkakaisa, at kumakalinga sa kalikasan.”
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gray-100 text-center text-black">
        <h2 className="text-4xl md:text-5xl font-bold mb-12">
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
              className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-transform duration-300 flex flex-col items-center"
            >
              <service.icon className="w-12 h-12 text-red-700 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">{service.title}</h3>
              <p>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-red-700 via-red-800 to-black text-white py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
          Handa ka na bang magsimula?
        </h2>
        <p className="mb-10 drop-shadow-md">
          Magparehistro o mag-log in upang magamit ang mga serbisyo ng barangay.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-6">
          <Link
            href="/auth-front/register"
            className="bg-white text-red-700 font-semibold px-8 py-4 rounded-full shadow-2xl hover:scale-105 hover:shadow-3xl transition-all duration-300"
          >
            Magparehistro
          </Link>

          <Link
            href="/auth-front/login"
            className="border border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-red-700 transition-all duration-300"
          >
            Mag-Log In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-6 text-center">
        <p>© {new Date().getFullYear()} Barangay Niugan. All rights reserved.</p>
      </footer>

      {/* Animations */}
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
