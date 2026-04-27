"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Bell, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AlertasPage() {
  const { data: session } = useSession();
  const [alertas, setAlertas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("TODAS");

  const fetchAlertas = () => {
    const url = filtro === "TODAS" ? "/api/alertas" : `/api/alertas?gravidade=${filtro}`;
    fetch(url).then(r => r.json()).then(setAlertas).catch(() => setAlertas([]));
  };

  useEffect(() => { if (session?.user.nivel === "SUPER_ADMIN") fetchAlertas(); }, [session, filtro]);

  const resolverAlerta = async (id: string) => {
    await fetch(`/api/alertas/${id}`, { method: "PATCH" });
    fetchAlertas();
  };

  const gravidadeCor: Record<string, string> = {
    BAIXA: "bg-blue-100 text-blue-800",
    MEDIA: "bg-yellow-100 text-yellow-800",
    ALTA: "bg-orange-100 text-orange-800",
    CRITICA: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const tipoIcone: Record<string, any> = {
    LOGIN_SUSPEITO: ShieldAlert,
    DESCONTO_EXCESSIVO: AlertTriangle,
    OS_SEM_PAGAMENTO: Clock,
    MULTIPLOS_CANCELAMENTOS: X,
    ACESSO_BLOQUEADO: ShieldAlert,
  };

  if (session?.user.nivel !== "SUPER_ADMIN") return <div className="p-6 text-gray-900 dark:text-white">Acesso restrito ao SUPER_ADMIN.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-red-600" /> Alertas de Segurança
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitorização de atividades suspeitas</p>
        </div>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <SelectItem value="TODAS">Todas</SelectItem>
            <SelectItem value="BAIXA">Baixa</SelectItem>
            <SelectItem value="MEDIA">Média</SelectItem>
            <SelectItem value="ALTA">Alta</SelectItem>
            <SelectItem value="CRITICA">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {alertas.length === 0 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-900 dark:text-white font-medium">Nenhum alerta encontrado</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">O sistema está a funcionar normalmente.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {alertas.map((a: any) => {
          const Icon = tipoIcone[a.tipo] || AlertTriangle;
          return (
            <Card key={a.id} className={`bg-white dark:bg-gray-800 border-l-4 ${a.gravidade === "CRITICA" ? "border-l-red-600" : a.gravidade === "ALTA" ? "border-l-orange-500" : a.gravidade === "MEDIA" ? "border-l-yellow-500" : "border-l-blue-500"} shadow-lg transition-all duration-200 hover:shadow-xl`}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${a.resolvido ? "bg-gray-100 dark:bg-gray-700" : "bg-red-50 dark:bg-red-900/30"}`}>
                    <Icon className={`h-5 w-5 ${a.resolvido ? "text-gray-400" : "text-red-600 dark:text-red-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${gravidadeCor[a.gravidade] || "bg-gray-100"}`}>{a.gravidade}</Badge>
                      <span className="text-xs text-gray-400">{a.tipo.replace(/_/g, " ")}</span>
                    </div>
                    <p className={`text-sm ${a.resolvido ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>{a.descricao}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(a.createdAt)}</p>
                  </div>
                </div>
                {!a.resolvido && (
                  <Button size="sm" variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 shrink-0" onClick={() => resolverAlerta(a.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Resolver
                  </Button>
                )}
                {a.resolvido && <Badge className="bg-green-100 text-green-800 shrink-0">Resolvido</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
