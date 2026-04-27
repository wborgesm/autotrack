"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, DollarSign, Users, Package, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const statusColors: Record<string, string> = {
  ABERTA: "#3b82f6",
  EM_DIAGNOSTICO: "#f59e0b",
  AGUARDANDO_PECAS: "#8b5cf6",
  EM_SERVICO: "#10b981",
  TESTE_FINAL: "#06b6d4",
  PRONTA: "#84cc16",
  ENTREGUE: "#059669",
  CANCELADA: "#ef4444",
};

const kpiGradients = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-amber-500 to-amber-600",
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ ordens: 0, receita: 0, clientes: 0, pecas: 0 });
  const [receitaMensal, setReceitaMensal] = useState<any[]>([]);
  const [statusCount, setStatusCount] = useState<any[]>([]);
  const [ultimasOrdens, setUltimasOrdens] = useState<any[]>([]);

  useEffect(() => {
    if (!session) return;
    const fetchDashboard = async () => {
      try {
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        const tenantId = session.user.tenantId;

        const res = await fetch("/api/relatorios/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId, primeiroDiaMes, ultimoDiaMes }),
        });
        const data = await res.json();

        setKpi({
          ordens: data.ordensAbertas || 0,
          receita: data.receitaMes || 0,
          clientes: data.totalClientes || 0,
          pecas: data.totalPecas || 0,
        });
        setReceitaMensal(data.receitaMensal || []);
        setStatusCount(data.statusCount || []);
        setUltimasOrdens(data.ultimasOrdens || []);
      } catch (e) {
        console.error("Erro ao carregar dashboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [session]);

  const statusData = statusCount.map((item: any) => ({
    name: item.status,
    value: item._count.status,
    color: statusColors[item.status] || "#6b7280",
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const kpis = [
    { label: "Ordens em Aberto", value: kpi.ordens, icon: Wrench, gradient: kpiGradients[0] },
    { label: "Receita do Mês", value: formatCurrency(kpi.receita), icon: DollarSign, gradient: kpiGradients[1] },
    { label: "Total de Clientes", value: kpi.clientes, icon: Users, gradient: kpiGradients[2] },
    { label: "Peças em Stock", value: kpi.pecas, icon: Package, gradient: kpiGradients[3] },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral da sua oficina</p>
        </div>
        <Badge variant="outline" className="w-fit">
          <TrendingUp className="h-4 w-4 mr-2" />
          {new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item, idx) => (
          <Card key={idx} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className={`bg-gradient-to-r ${item.gradient} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{item.label}</p>
                  <p className="text-2xl font-bold mt-1">{item.value}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <item.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Receita por Dia (Mês Atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {receitaMensal.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <DollarSign className="h-12 w-12 mb-2" />
                <p>Sem dados de receita este mês</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={receitaMensal} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                  />
                  <Bar dataKey="receita" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-blue-600" />
              Status das Ordens
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Wrench className="h-12 w-12 mb-2" />
                <p>Nenhuma ordem registada</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Ordens */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Últimas Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          {ultimasOrdens.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Wrench className="h-12 w-12 mx-auto mb-2" />
              <p>Nenhuma ordem recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ultimasOrdens.map((os: any) => (
                <div key={os.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                      <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        #{os.numero || os.id.slice(-6)} — {os.cliente?.nome || "Cliente"}
                      </p>
                      <p className="text-sm text-gray-500">{os.veiculo?.placa || "Sem veículo"} • {os.veiculo?.modelo || ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(os.total)}</p>
                    <Badge style={{ backgroundColor: statusColors[os.status] || "#6b7280", color: "#fff" }}>
                      {os.status === "ENTREGUE" ? "✅ Entregue" :
                       os.status === "PRONTA" ? "✅ Pronta" :
                       os.status === "CANCELADA" ? "❌ Cancelada" :
                       os.status}
                    </Badge>
                    <p className="text-xs text-gray-400">{formatDate(os.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
