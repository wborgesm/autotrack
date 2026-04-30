"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SessionTracker() {
  const { data: session } = useSession();
  useEffect(() => {
    if (!session?.user?.id) return;
    const ping = () => {
      fetch("/api/sessao/registar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          ip: "",
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    };
    ping(); // primeira chamada imediata
    const interval = setInterval(ping, 60 * 1000); // a cada minuto
    return () => clearInterval(interval);
  }, [session]);
  return null;
}
