"use client";

import { useEffect } from "react";

export default function VersionCheck() {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch("/version.json", { cache: "no-cache" });
        if (!res.ok) return;
        const data = await res.json();
        const latestVersion = data.version;
        const currentVersion = localStorage.getItem("app-version");

        if (currentVersion && currentVersion !== latestVersion) {
          // Nova versão detetada – recarrega automaticamente
          localStorage.setItem("app-version", latestVersion);
          window.location.reload();
        } else if (!currentVersion) {
          localStorage.setItem("app-version", latestVersion);
        }
      } catch (e) {
        // ficheiro version.json ainda não existe (ignorar)
      }
    };

    // Verifica imediatamente e depois a cada 60 segundos
    checkVersion();
    const interval = setInterval(checkVersion, 60000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
