import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatCurrency(value: number | string | null | undefined, locale: string = "pt-PT", currency: string = "EUR"): string {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (numericValue === null || numericValue === undefined || isNaN(numericValue)) return new Intl.NumberFormat(locale, { style: "currency", currency }).format(0);
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(numericValue);
}

export function formatDate(date: Date | string | null | undefined, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }, locale: string = "pt-PT"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, options);
}

export function formatDateTime(date: Date | string | null | undefined, locale: string = "pt-PT"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 9) return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  if (cleaned.length === 11) return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "$1 $2 $3");
  return phone;
}

export function formatNIF(nif: string | null | undefined): string {
  if (!nif) return "-";
  const cleaned = nif.replace(/\D/g, "");
  if (cleaned.length !== 9) return nif;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

export function formatCPF(cpf: string | null | undefined): string { return formatNIF(cpf); } // manter compatibilidade

export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return "-";
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1 $2 $3 $4 $5");
}

export function formatPlaca(placa: string | null | undefined): string {
  if (!placa) return "-";
  const cleaned = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length === 7) {
    if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleaned)) return cleaned;
    return cleaned.replace(/([A-Z]{3})(\d{4})/, "$1-$2");
  }
  return placa;
}

export function truncate(text: string, maxLength: number): string { return text.length <= maxLength ? text : text.slice(0, maxLength) + "..."; }
export function getInitials(name: string | null | undefined): string { if (!name) return "?"; const parts = name.trim().split(/\s+/); return parts.length === 1 ? parts[0].charAt(0).toUpperCase() : (parts[0].charAt(0) + parts[parts.length-1].charAt(0)).toUpperCase(); }
export function calculatePercentage(value: number, total: number): number { return total === 0 ? 0 : (value / total) * 100; }
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ABERTA: "bg-blue-100 text-blue-800", EM_DIAGNOSTICO: "bg-purple-100 text-purple-800", AGUARDANDO_PECAS: "bg-yellow-100 text-yellow-800",
    EM_SERVICO: "bg-indigo-100 text-indigo-800", TESTE_FINAL: "bg-orange-100 text-orange-800", PRONTA: "bg-green-100 text-green-800",
    ENTREGUE: "bg-gray-100 text-gray-800", CANCELADA: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ABERTA: "Aberta", EM_DIAGNOSTICO: "Em diagnóstico", AGUARDANDO_PECAS: "A aguardar peças",
    EM_SERVICO: "Em serviço", TESTE_FINAL: "Teste final", PRONTA: "Pronta", ENTREGUE: "Entregue", CANCELADA: "Cancelada",
  };
  return map[status] || status;
}
