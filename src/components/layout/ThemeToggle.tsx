"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-200 dark:bg-gray-700 transition"
      title={`Tema atual: ${theme}`}
    >
      <ThemeIcon size={18} className="text-gray-800 dark:text-gray-200" />
    </button>
  );
}
