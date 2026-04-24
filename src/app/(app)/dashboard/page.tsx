"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, DollarSign, Users, Wrench } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const statusColors: Record<string, string> = {
  ABERTA: "#3b82f6",
  EM_DIAGNOSTICO: "#f59e0b",
  AGUARDANDO_PECAS: "#8b5cf6",
  EM_SERVICO: "#10b981",
  TESTE_FINAL: "#06b6d4",
  PRONTA: "#84cc16",
  FINALIZADA: "#6b7280",
  ENTREGUE: "#059669",
  CANCELADA: "#ef4444",
};

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

  if (loading) return <div className="p-6 text-center">A carregar...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordens em aberto</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.ordens}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpi.receita)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.clientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peças em stock</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.pecas}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Receita por dia (mês atual)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={receitaMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status das Ordens</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Últimas ordens</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ultimasOrdens.map((os: any) => (
                <TableRow key={os.id}>
                  <TableCell className="font-medium">#{os.numero || os.id}</TableCell>
                  <TableCell>{os.cliente?.nome}</TableCell>
                  <TableCell>{formatCurrency(os.total)}</TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: statusColors[os.status] || "#6b7280" }}>{os.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(os.createdAt).toLocaleDateString("pt-PT")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
