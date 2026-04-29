import { cn } from "@/lib/utils";

const mapa: Record<string, { bg: string; text: string; label: string }> = {
  ABERTA:           { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", label: "Aberta" },
  EM_EXECUCAO:      { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-300", label: "Em execução" },
  PRONTA:           { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300", label: "Pronta" },
  ENTREGUE:         { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", label: "Entregue" },
  CANCELADA:        { bg: "bg-red-100 dark:bg-red-900", text: "text-red-700 dark:text-red-300", label: "Cancelada" },
  PENDENTE:         { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-300", label: "Pendente" },
  RECEBIDA:         { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300", label: "Recebida" },
};

export function BadgeEstado({ estado }: { estado: string }) {
  const item = mapa[estado] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", label: estado };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", item.bg, item.text)}>
      {item.label}
    </span>
  );
}
