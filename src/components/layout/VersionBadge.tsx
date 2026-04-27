"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function VersionBadge() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    fetch("/api/version")
      .then(r => r.json())
      .then(d => setVersion(`v${d.version} – ${d.nome}`))
      .catch(() => setVersion(""));
  }, []);

  if (!version) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant="secondary" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 shadow-lg px-3 py-1.5">
        {version}
      </Badge>
    </div>
  );
}
