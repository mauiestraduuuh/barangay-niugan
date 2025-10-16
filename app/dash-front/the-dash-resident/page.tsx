"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, User, CreditCard, Clipboard, MessageCircle, Bell } from "lucide-react";

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
}

export default function ResidentDashboard() {
  const [resident, setResident] = useState<Resident | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchResident();
    fetchAnnouncements();
  }, []);

  const fetchResident = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/dash/the-dash", {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      if (res.ok) setResident(data.resident);
      else console.error(data.message);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/dash/announcement");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const data: Announcement[] = await res.json();
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
    }
  };

  const features = [
    { name: "Manage Profile", path: "/dash-front/resident", icon: User },
    { name: "Digital ID", path: "/dash-front/digital-id", icon: CreditCard },
    { name: "Certificates", path: "/dash-front/certificate-request", icon: Clipboard },
    { name: "Feedback / Complain", path: "/dash-front/feedback", icon: MessageCircle },
    { name: "Notifications", path: "/dash-front/notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-900 relative">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow flex flex-col p-6 space-y-8">
        <h2 className="text-2xl font-semibold mb-4">Resident Dashboard</h2>

        <nav className="flex flex-col space-y-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.name}
                href={feature.path}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 transition"
              >
                <Icon size={20} /> {feature.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button className="flex items-center gap-3 text-red-500 hover:text-red-700 transition">
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-auto">
        {resident && (
          <div className="flex items-center gap-4 mb-6">
            <img
              src={resident.photo_url || "/default-profile.png"}
              alt="Profile"
              className="w-16 h-16 rounded-full border"
            />
            <h1 className="text-3xl font-semibold">
              Welcome, {resident.first_name} {resident.last_name}!
            </h1>
          </div>
        )}

        <section>
          <header className="mb-6">
            <h2 className="text-3xl font-semibold">Announcements</h2>
          </header>

          {announcements.length === 0 ? (
            <p className="text-gray-500">No announcements yet.</p>
          ) : (
            <div className="space-y-6">
              {announcements.map((ann) => (
                <div
                  key={ann.announcement_id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-semibold mb-2">{ann.title}</h3>
                  <p className="text-gray-700">{ann.content ?? "No content provided."}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Posted at: {new Date(ann.posted_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
