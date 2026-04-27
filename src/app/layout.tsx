import VersionBadge from "@/components/layout/VersionBadge";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import VersionCheck from "@/components/providers/VersionCheck";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Autotrack - Sistema de Gestão para Oficinas",
  description: "Gerencie sua oficina com eficiência",
  icons: { icon: "https://autotrack.pt/gps/img/icat.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="https://autotrack.pt/gps/img/logoatpng.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <VersionCheck />
          <VersionBadge />
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
