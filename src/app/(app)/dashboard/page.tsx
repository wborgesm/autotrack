"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeEstado } from "@/components/ui/BadgeEstado";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Wrench, DollarSign, Package, Users, Globe } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import OnlineUsers from "@/components/OnlineUsers";

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  tendencia?: number;
  icone: React.ReactNode;
  cor: string;
}

function KpiCard({ titulo, valor, tendencia, icone, cor }: KpiCardProps) {
  return (
    <Card className="glass">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{titulo}</p>
          <p className="text-2xl font-bold">{valor}</p>
          {tendencia !== undefined && (
            <p className={`text-xs flex items-center gap-0.5 mt-1 ${tendencia > 0 ? "text-green-600" : tendencia < 0 ? "text-red-600" : "text-gray-500"}`}>
              {tendencia > 0 ? <TrendingUp className="h-3 w-3" /> : tendencia < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {Math.abs(tendencia).toFixed(1)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${cor}`}>{icone}</div>
      </CardContent>
    </Card>
  );
}

const CORES_ESTADO: Record<string, string> = {
  ABERTA: "#3b82f6",
  EM_EXECUCAO: "#eab308",
  PRONTA: "#22c55e",
  ENTREGUE: "#6b7280",
  CANCELADA: "#ef4444",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dados, setDados] = useState<any>(null);
  const [stockCritico, setStockCritico] = useState(0);

  useEffect(() => {
    fetch("/api/relatorios/dashboard")
      .then(r => r.json())
      .then(d => {
        setDados(d);
        setStockCritico(d.stockCritico || 0);
      });
  }, []);

  if (!dados) return <p className="p-6">A carregar...</p>;

  const distribuicao: { name: string; value: number; color: string }[] = Object.entries(dados.osPorEstado || {}).map(([estado, total]) => ({
    name: estado,
    value: total as number,
    color: CORES_ESTADO[estado] || "#9ca3af",
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard titulo="OS Abertas" valor={dados.osAbertas} tendencia={dados.tendenciaOS} icone={<Wrench />} cor="bg-blue-100 text-blue-600" />
        <KpiCard titulo="Faturação (mês)" valor={`€ ${dados.faturacaoMes?.toLocaleString("pt-PT")}`} tendencia={dados.tendenciaFaturacao} icone={<DollarSign />} cor="bg-green-100 text-green-600" />
        <KpiCard titulo="Stock Crítico" valor={stockCritico} icone={<Package />} cor="bg-amber-100 text-amber-600" />
        <KpiCard titulo="Técnicos Activos" valor={dados.tecnicosActivos} icone={<Users />} cor="bg-purple-100 text-purple-600" />
        {session?.user?.nivel === "SUPER_ADMIN" && (
          <KpiCard titulo="Online Agora" valor={0} icone={<Globe className="h-5 w-5" />} cor="bg-green-100 text-green-600" />
        )}
      </div>

      {stockCritico > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="text-sm">{stockCritico} peças com stock crítico.</span>
          <a href="/estoque?filtro=critico" className="ml-auto text-sm font-medium text-amber-700 dark:text-amber-300 underline">Ver stock</a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Distribuição de OS (este mês)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={distribuicao} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {distribuicao.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-3">
              {distribuicao.map(e => (
                <div key={e.name} className="flex items-center gap-1 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} /> {e.name}: {e.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Últimas Ordens de Serviço</h3>
            <ul className="space-y-3">
              {(dados.ultimasOS || []).slice(0, 5).map((os: any) => (
                <li key={os.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">#{os.numero} — {os.cliente?.nome}</p>
                    <p className="text-xs text-gray-500">{os.veiculo?.placa}</p>
                  </div>
                  <BadgeEstado estado={os.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <OnlineUsers />
    </div>
  );
}
