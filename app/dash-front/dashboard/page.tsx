//base code for our dashboard

"use client";

import { useState } from 'react';
import {BellIcon,UserIcon,HomeIcon,ChartBarIcon,CogIcon,Bars3Icon,ChevronLeftIcon,ChevronRightIcon,
XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-gray-50 shadow-lg rounded-xl transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'block' : 'hidden'
        } md:block md:relative md:translate-x-0 ${
          sidebarOpen ? 'fixed inset-y-0 left-0 z-50 md:static md:translate-x-0' : ''
        }`}
      >
        {/* Top Section */}
        <div className="p-4 flex items-center justify-between">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6">
          <ul>
            {[
              { name: 'home', label: 'Home', icon: HomeIcon },
              { name: 'analytics', label: 'Analytics', icon: ChartBarIcon },
              { name: 'settings', label: 'Settings', icon: CogIcon },
            ].map(({ name, label, icon: Icon }) => (
              <li key={name} className="mb-2">
                <button
                  onClick={() => setActiveItem(name)}
                  className={`relative flex items-center w-full px-4 py-2 text-left group transition-colors duration-200 ${
                    activeItem === name
                      ? 'text-red-700'
                      : 'text-black hover:text-red-700'
                  }`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-full ${
                      activeItem === name ? 'block' : 'hidden'
                    }`}
                  />
                  <Icon className="w-6 h-6 mr-2 group-hover:text-red-700" />
                  {sidebarOpen && (
                    <span className="group-hover:text-red-700">{label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Toggle Button (Desktop Only) - At the Bottom */}
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

      {/* Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gray-50 shadow-sm p-4 flex justify-between items-center rounded-xl">
          <button
            onClick={toggleSidebar}
            className="block md:hidden text-black hover:text-red-700 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-black">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="text-black hover:text-red-700 focus:outline-none">
              <BellIcon className="w-6 h-6" />
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-black" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-black mb-4">
                  Card {i + 1}
                </h2>
                <p className="text-gray-700">
                  Placeholder content for card {i + 1}.
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
