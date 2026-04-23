import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "relatorios")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const tipo = searchParams.get("tipo") || "resumo";
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  const dateFilter: any = {};
  if (inicio && fim) {
    dateFilter.gte = new Date(inicio);
    dateFilter.lte = new Date(fim);
  }

  try {
    let data: any;

    switch (tipo) {
      case "ordens":
        data = await prisma.ordemServico.findMany({
          where: { tenantId, dataEntrada: dateFilter },
          include: {
            cliente: { select: { nome: true } },
            veiculo: { select: { placa: true, modelo: true } },
            tecnico: { select: { nome: true } },
          },
          orderBy: { dataEntrada: "desc" },
        });
        break;

      case "faturamento":
        data = await prisma.$queryRaw`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', data), 'YYYY-MM') as mes,
            SUM(CASE WHEN tipo = 'RECEITA' THEN valor ELSE 0 END) as receita,
            SUM(CASE WHEN tipo = 'DESPESA' THEN valor ELSE 0 END) as despesa,
            COUNT(DISTINCT "ordemId") as qtdOrdens
          FROM "lancamentos_financeiros"
          WHERE "tenantId" = ${tenantId}
            AND data >= ${dateFilter.gte || new Date(0)} 
            AND data <= ${dateFilter.lte || new Date()}
          GROUP BY DATE_TRUNC('month', data)
          ORDER BY DATE_TRUNC('month', data) ASC
        `;
        data = (data as any[]).map((item: any) => ({
          ...item,
          lucro: Number(item.receita) - Number(item.despesa),
        }));
        break;

      case "tecnicos":
        data = await prisma.tecnico.findMany({
          where: { tenantId, ativo: true },
          select: {
            id: true,
            nome: true,
            especialidade: true,
            _count: { select: { ordens: { where: { dataEntrada: dateFilter } } } },
            ordens: {
              where: { dataEntrada: dateFilter },
              select: { status: true, total: true, dataEntrada: true, dataEntrega: true },
            },
          },
        });
        data = data.map((t: any) => {
          const finalizadas = t.ordens.filter((o: any) => o.status === "ENTREGUE");
          const faturamento = finalizadas.reduce((acc: number, o: any) => acc + Number(o.total), 0);
          const tempoMedio = finalizadas.length
            ? finalizadas.reduce((acc: number, o: any) => {
                if (o.dataEntrega) {
                  return acc + (new Date(o.dataEntrega).getTime() - new Date(o.dataEntrada).getTime());
                }
                return acc;
              }, 0) / finalizadas.length / (1000 * 60 * 60)
            : 0;
          return {
            tecnico: t.nome,
            especialidade: t.especialidade,
            totalOrdens: t._count.ordens,
            ordensFinalizadas: finalizadas.length,
            faturamento,
            tempoMedioHoras: tempoMedio,
          };
        });
        break;

      case "estoque":
        const movimentos = await prisma.movimentoEstoque.findMany({
          where: { tenantId, createdAt: dateFilter },
          include: { peca: { select: { nome: true } } },
          orderBy: { createdAt: "desc" },
        });
        const criticas = await prisma.peca.findMany({
          where: { tenantId, qtdEstoque: { lte: prisma.peca.fields.qtdMinima } },
        });
        data = { movimentos, pecasCriticas: criticas };
        break;

      case "clientes":
        data = await prisma.cliente.findMany({
          where: { tenantId, ativo: true },
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true,
            _count: { select: { ordens: { where: { dataEntrada: dateFilter } } } },
            ordens: {
              where: { dataEntrada: dateFilter },
              select: { total: true },
            },
          },
        });
        data = data.map((c: any) => ({
          ...c,
          totalGasto: c.ordens.reduce((acc: number, o: any) => acc + Number(o.total), 0),
        }));
        break;

      case "resumo":
      default:
        const totalOrdens = await prisma.ordemServico.count({ where: { tenantId, dataEntrada: dateFilter } });
        const totalClientes = await prisma.cliente.count({ where: { tenantId, createdAt: dateFilter } });
        const faturamento = await prisma.lancamentoFinanceiro.aggregate({
          where: { tenantId, tipo: "RECEITA", data: dateFilter },
          _sum: { valor: true },
        });
        const topServicos = await prisma.itemOrdem.groupBy({
          by: ["servicoId"],
          where: { ordem: { tenantId, dataEntrada: dateFilter } },
          _count: { _all: true },
          orderBy: { _count: { servicoId: "desc" } },
          take: 5,
        });
        const servicosNomes = await prisma.servico.findMany({
          where: { id: { in: topServicos.map((s) => s.servicoId) } },
          select: { id: true, nome: true },
        });
        data = {
          totalOrdens,
          totalClientes,
          faturamento: faturamento._sum.valor || 0,
          topServicos: topServicos.map((s) => ({
            nome: servicosNomes.find((n) => n.id === s.servicoId)?.nome,
            quantidade: s._count._all,
          })),
        };
        break;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
