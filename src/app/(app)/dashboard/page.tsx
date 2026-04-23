import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  ClipboardList,
  Calendar,
  DollarSign,
  Car,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const tenantId = session.user.tenantId;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const [
    ordensAbertas,
    ordensConcluidas,
    agendamentosHoje,
    faturamentoMes,
    despesasMes,
    veiculosEmServico,
    clientesAtivos,
    dadosGrafico,
    statusCount,
    ultimasOrdens,
    proximosAgendamentos,
  ] = await Promise.all([
    prisma.ordemServico.count({
      where: {
        tenantId,
        status: { in: ["ABERTA", "EM_DIAGNOSTICO", "AGUARDANDO_PECAS", "EM_SERVICO", "TESTE_FINAL"] },
      },
    }),
    prisma.ordemServico.count({
      where: { tenantId, status: "ENTREGUE", dataEntrada: { gte: primeiroDiaMes, lte: ultimoDiaMes } },
    }),
    prisma.agendamento.count({
      where: {
        tenantId,
        dataHora: { gte: hoje, lt: amanha },
        status: { in: ["PENDENTE", "CONFIRMADO"] },
      },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      where: { tenantId, tipo: "RECEITA", data: { gte: primeiroDiaMes, lte: ultimoDiaMes } },
      _sum: { valor: true },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      where: { tenantId, tipo: "DESPESA", data: { gte: primeiroDiaMes, lte: ultimoDiaMes } },
      _sum: { valor: true },
    }),
    prisma.veiculo.count({
      where: { tenantId, ordens: { some: { status: { not: "ENTREGUE" } } } },
    }),
    prisma.cliente.count({ where: { tenantId, ativo: true } }),
    prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', data), 'YYYY-MM') as mes,
        SUM(CASE WHEN tipo = 'RECEITA' THEN valor ELSE 0 END) as receita,
        SUM(CASE WHEN tipo = 'DESPESA' THEN valor ELSE 0 END) as despesa
      FROM "lancamentos_financeiros"
      WHERE "tenantId" = ${tenantId}
        AND data >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', data)
      ORDER BY DATE_TRUNC('month', data) ASC
    `,
    prisma.ordemServico.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { status: true },
    }),
    prisma.ordemServico.findMany({
      where: { tenantId },
      include: { cliente: true, veiculo: true },
      orderBy: { dataEntrada: "desc" },
      take: 5,
    }),
    prisma.agendamento.findMany({
      where: { tenantId, dataHora: { gte: hoje }, status: { in: ["PENDENTE", "CONFIRMADO"] } },
      include: { cliente: true, veiculo: true, servico: true },
      orderBy: { dataHora: "asc" },
      take: 3,
    }),
  ]);

  const receita = faturamentoMes._sum.valor?.toNumber() || 0;
  const despesa = despesasMes._sum.valor?.toNumber() || 0;
  const lucro = receita - despesa;

  const chartData = (dadosGrafico as any[]).map((item) => ({
    mes: new Date(item.mes + "-01").toLocaleDateString("pt-BR", { month: "short" }),
    receita: Number(item.receita) || 0,
    despesa: Number(item.despesa) || 0,
    lucro: (Number(item.receita) || 0) - (Number(item.despesa) || 0),
  }));

  // Dados para gráfico de pizza
  const statusColors: Record<string, string> = {
    ABERTA: "#3b82f6",
    EM_DIAGNOSTICO: "#8b5cf6",
    AGUARDANDO_PECAS: "#f59e0b",
    EM_SERVICO: "#6366f1",
    TESTE_FINAL: "#f97316",
    PRONTA: "#10b981",
    ENTREGUE: "#6b7280",
    CANCELADA: "#ef4444",
  };

  const statusData = statusCount.map((item) => ({
    name: item.status,
    value: item._count.status,
    color: statusColors[item.status] || "#6b7280",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel de Controlo</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Bem-vindo, {session.user.name}. Aqui está o resumo do seu dia.
        </p>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-blue-500 bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Ordens em aberto</CardTitle>
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{ordensAbertas}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{ordensConcluidas} concluídas este mês</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500 bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita do mês</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(receita)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lucro: {formatCurrency(lucro)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas do mês</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(despesa)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Margem: {receita > 0 ? ((lucro / receita) * 100).toFixed(1) : 0}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500 bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes ativos</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{clientesAtivos}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{veiculosEmServico} veículos em serviço</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader><CardTitle className="text-gray-900 dark:text-white">Faturação (6 meses)</CardTitle></CardHeader>
          <CardContent><RevenueChart data={chartData} /></CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader><CardTitle className="text-gray-900 dark:text-white">Status das Ordens</CardTitle></CardHeader>
          <CardContent><StatusPieChart data={statusData} /></CardContent>
        </Card>
      </div>

      {/* Tabela de últimas OS e agendamentos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader><CardTitle className="text-gray-900 dark:text-white">Últimas Ordens de Serviço</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ultimasOrdens.map((os) => (
                <div key={os.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">#{os.numero} - {os.cliente.nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{os.veiculo.placa} | {os.status}</p>
                  </div>
                  <Badge className={
                    os.status === "ENTREGUE" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                    os.status === "CANCELADA" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }>
                    {os.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader><CardTitle className="text-gray-900 dark:text-white">Próximos Agendamentos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosAgendamentos.map((ag) => (
                <div key={ag.id} className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{ag.cliente.nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {ag.servico?.nome || "Serviço não especificado"} | {ag.veiculo.placa}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ag.dataHora.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {ag.dataHora.toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
              ))}
              {proximosAgendamentos.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum agendamento próximo.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
