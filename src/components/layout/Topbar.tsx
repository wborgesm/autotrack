"use client";

import ThemeToggle from "./ThemeToggle";
import { Menu, Bell } from "lucide-react";
import { useSession } from "next-auth/react";

interface TopbarProps { onMenuClick: () => void; }

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();
  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:px-6">
      <button onClick={onMenuClick} className="p-2 -ml-2 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700">
        <Menu size={20} className="text-gray-800 dark:text-gray-200" />
      </button>

      {/* Barra de pesquisa removida – será implementada futuramente */}

      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 relative">
          <Bell size={20} className="text-gray-800 dark:text-gray-200" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="hidden sm:block">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{session?.user.name}</span>
          <span className="block text-xs text-gray-600 dark:text-gray-400">
            {session?.user.nivel === "ADMIN" ? "Administrador" : session?.user.nivel}
          </span>
        </div>
      </div>
    </header>
  );
}
