"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import SessionTracker from "@/components/SessionTracker";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <SessionTracker />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex min-h-screen">
          {/* Sidebar fixa em desktop, drawer em mobile */}
          <div
            className={`fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>

          <div className="flex-1 flex flex-col w-full min-w-0">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
