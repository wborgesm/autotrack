import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Autotrack - Sistema de Gestão para Oficinas",
  description: "Gerencie sua oficina com eficiência",
  icons: "https://autotrack.pt/gps/img/icat.png",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  let tenantStyles = {};
  if (session?.user?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { corPrimaria: true, corSecundaria: true },
    });
    if (tenant) {
      tenantStyles = {
        "--color-primary": tenant.corPrimaria || "#3b82f6",
        "--color-secondary": tenant.corSecundaria || "#1e40af",
      };
    }
  }

  return (
    <html lang="pt-PT" style={tenantStyles as any}>
      <body className={inter.className}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
