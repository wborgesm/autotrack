"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Calendar, ClipboardList, Users, Car, Wrench,
  Package, DollarSign, BarChart3, ShieldCheck, ShoppingCart, Wallet, CreditCard, Coffee, FileText, Settings, MapPin, Star, LogOut, X, Bot,
  Building, Bell, MessageCircle, Clock, KeyRound, Bike
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface SidebarProps { onClose?: () => void; }

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [tipoOficina, setTipoOficina] = useState("AMBOS");
  const [alertasCount, setAlertasCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    fetch("/api/configuracoes")
      .then(r => r.json())
      .then(d => { if (d.oficina?.tipoOficina) setTipoOficina(d.oficina.tipoOficina); })
      .catch(() => {});

    if (session.user.nivel === "SUPER_ADMIN") {
      fetch("/api/alertas?resolvido=false&limit=5")
        .then(r => r.json())
        .then(d => setAlertasCount(Array.isArray(d) ? d.length : d.total || 0))
        .catch(() => setAlertasCount(0));
    }
  }, [session]);

  const isActive = (path: string) => pathname?.startsWith(path);
  const handleLogout = () => signOut({ callbackUrl: window.location.origin });

  const getVeiculoIcon = () => {
    if (tipoOficina === "CARROS") return Car;
    if (tipoOficina === "MOTOS") return Bike;
    return Car;
  };

  const nivel = session?.user?.nivel || "";

  const navItems = [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/caixa", label: "Caixa", icon: ShoppingCart },
    { href: "/encomendas", label: "Encomendas", icon: Package },
    { href: "/chatbot", label: "Assistente IA", icon: Bot },
    { href: "/agenda", label: "Agenda", icon: Calendar },
    { href: "/ordens", label: "Ordens", icon: ClipboardList },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/veiculos", label: "Veículos", icon: getVeiculoIcon() },
    { href: "/servicos", label: "Serviços", icon: Wrench },
    { href: "/estoque", label: "Stock", icon: Package },
    { href: "/financeiro", label: "Financeiro", icon: DollarSign },
    { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  ];

  // Itens de admin (visíveis para ADMIN e SUPER_ADMIN)
  const adminItems = [
    { href: "/usuarios", label: "Utilizadores", icon: Users },
  ];

  // Itens de auditoria (visíveis para ADMIN e SUPER_ADMIN)
  const auditoriaItems = [
    { href: "/auditoria", label: "Auditoria", icon: ShieldCheck },
    { href: "/alertas", label: "Alertas", icon: Bell, badge: alertasCount },
  ];

  // Itens exclusivos do SUPER_ADMIN
  const superAdminItems = [
    { href: "/tenants", label: "Empresas", icon: Building },
    { href: "/configuracoes/notificacoes", label: "Notificações", icon: Bell },
    { href: "/configuracoes/whatsapp", label: "WhatsApp", icon: MessageCircle },
  ];

  const addonItems = [
    { href: "/ponto", label: "Ponto Eletrónico", icon: Clock },
    { href: "/alugueres", label: "Alugueres", icon: KeyRound },
  ];
  if (session?.user.addons?.gps) addonItems.push({ href: "/addons/gps", label: "Autotrack", icon: MapPin });
  if (session?.user.addons?.pontos) addonItems.push({ href: "/addons/pontos", label: "Fidelidade", icon: Star });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-200">
      <div className="relative w-full border-b border-gray-200 dark:border-gray-700 py-2">
        <Link href="/dashboard" className="block w-full px-[5%]">
          <img src="https://autotrack.pt/gps/img/logoatpng.png" alt="Autotrack" className="w-full h-auto object-contain max-h-[7.5rem] mx-auto filter brightness(0) dark:filter dark:brightness(100)" />
        </Link>
        {onClose && <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 lg:hidden"><X size={20} /></button>}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium", isActive(item.href) ? "bg-blue-900 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 hover:text-white")}>
            <item.icon size={18} />{item.label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700" />
        <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Módulos Adicionais</p>
        {addonItems.map(item => (
          <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium", isActive(item.href) ? "bg-blue-900 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 hover:text-white")}>
            <item.icon size={18} />{item.label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700" />

        {/* Configurações visível para TODOS exceto CLIENTE */}
        {(nivel !== "CLIENTE" && nivel !== "") && (
          <Link href="/configuracoes" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium", isActive("/configuracoes") ? "bg-blue-900 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 hover:text-white")}>
            <Settings size={18} />Configurações
          </Link>
        )}

        {/* Admin items (ADMIN e SUPER_ADMIN) */}
        {(nivel === "ADMIN" || nivel === "SUPER_ADMIN") && adminItems.map(item => (
          <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium", isActive(item.href) ? "bg-blue-900 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 hover:text-white")}>
            <item.icon size={18} />{item.label}
          </Link>
        ))}

        {/* Auditoria (ADMIN e SUPER_ADMIN) */}
        {(nivel === "ADMIN" || nivel === "SUPER_ADMIN") && auditoriaItems.map(item => (
          <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium", isActive(item.href) ? "bg-blue-900 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 hover:text-white")}>
            <item.icon size={18} />{item.label}
            {item.badge != null && item.badge > 0 && <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">{item.badge}</span>}
          </Link>
        ))}

        {/* SUPER_ADMIN items */}
        {nivel === "SUPER_ADMIN" && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700" />
            <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Super Admin</p>
            {superAdminItems.map(item => (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium", isActive(item.href) ? "bg-purple-900 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 hover:text-white")}>
                <item.icon size={18} />{item.label}
              </Link>
            ))}
          </>
        )}
      </nav>
      <div className="p-3 border-t border-gray-700">
        <div className="flex items-center gap-3 px-2 py-2">
          {session?.user.avatar ? <img src={session.user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-medium">{session?.user.name?.charAt(0).toUpperCase() || "U"}</div>}
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{session?.user.name}</p><p className="text-xs text-gray-600 dark:text-gray-400 truncate">{session?.user.email}</p></div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-700" title="Sair"><LogOut size={18} /></button>
        </div>
      </div>
    </div>
  );
}
