import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { searchParams } = req.nextUrl;
  const tipo = searchParams.get("tipo") || "resumo";
  const inicio = searchParams.get("inicio") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const fim = searchParams.get("fim") || new Date().toISOString();

  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);

  switch (tipo) {
    case "resumo":
      const [totalOrdens, ordensConcluidas, totalReceita, totalDespesa, totalClientes] = await Promise.all([
        prisma.ordemServico.count({ where: { tenantId, createdAt: { gte: dataInicio, lte: dataFim } } }),
        prisma.ordemServico.count({ where: { tenantId, status: "ENTREGUE", updatedAt: { gte: dataInicio, lte: dataFim } } }),
        prisma.lancamentoFinanceiro.aggregate({ where: { tenantId, tipo: "RECEITA", createdAt: { gte: dataInicio, lte: dataFim } }, _sum: { valor: true } }),
        prisma.lancamentoFinanceiro.aggregate({ where: { tenantId, tipo: "DESPESA", createdAt: { gte: dataInicio, lte: dataFim } }, _sum: { valor: true } }),
        prisma.cliente.count({ where: { tenantId, createdAt: { gte: dataInicio, lte: dataFim } } }),
      ]);
      return NextResponse.json({
        "Ordens criadas": totalOrdens,
        "Ordens concluídas": ordensConcluidas,
        "Receita total": `${Number(totalReceita._sum.valor || 0).toFixed(2)} €`,
        "Despesa total": `${Number(totalDespesa._sum.valor || 0).toFixed(2)} €`,
        "Lucro": `${(Number(totalReceita._sum.valor || 0) - Number(totalDespesa._sum.valor || 0)).toFixed(2)} €`,
        "Novos clientes": totalClientes,
      });

    case "ordens":
      const ordens = await prisma.ordemServico.findMany({
        where: { tenantId, createdAt: { gte: dataInicio, lte: dataFim } },
        select: { numero: true, status: true, total: true, createdAt: true, cliente: { select: { nome: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(ordens);

    case "financeiro":
      const lancamentos = await prisma.lancamentoFinanceiro.findMany({
        where: { tenantId, createdAt: { gte: dataInicio, lte: dataFim } },
        select: { tipo: true, descricao: true, valor: true, data: true, categoria: true },
        orderBy: { data: "desc" },
      });
      return NextResponse.json(lancamentos);

    default:
      return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
  }
}
