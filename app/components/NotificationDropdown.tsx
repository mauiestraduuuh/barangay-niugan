// add this to import at any page import NotificationDropdown from "./components/notif-dropdown";

"use client";

import { useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";

interface Notification {
  notification_id: number;
  type: string; // e.g., 'certificate_request', 'complaint', 'announcement'
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationDropdownProps {
  notifications: Notification[]; // Pass notifications from parent
}

export default function NotificationDropdown({ notifications }: NotificationDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const recentNotifications = notifications.slice(0, 5); // Show top 5 recent

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="text-black hover:text-red-700 focus:outline-none relative"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Recent Notifications</h3>
            {recentNotifications.length === 0 ? (
              <p className="text-gray-500">No notifications yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentNotifications.map((notif) => (
                  <li key={notif.notification_id} className={`p-2 rounded ${notif.is_read ? 'bg-gray-100' : 'bg-blue-50'}`}>
                    <p className="text-sm font-medium">{notif.type.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-gray-400">{new Date(notif.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}