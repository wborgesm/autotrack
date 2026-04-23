"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 lg:hidden">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
