import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { primeiroDiaMes, ultimoDiaMes } = await req.json();
  const inicio = new Date(primeiroDiaMes);
  const fim = new Date(ultimoDiaMes);

  const [ordensAbertas, receitaMes, totalClientes, totalPecas, statusCount, ultimasOrdens] = await Promise.all([
    prisma.ordemServico.count({ where: { tenantId, status: { not: "ENTREGUE" } } }),
    prisma.lancamentoFinanceiro.aggregate({ where: { tenantId, tipo: "RECEITA", createdAt: { gte: inicio, lte: fim } }, _sum: { valor: true } }),
    prisma.cliente.count({ where: { tenantId } }),
    prisma.peca.count({ where: { tenantId } }),
    prisma.ordemServico.groupBy({ by: ["status"], where: { tenantId }, _count: { status: true } }),
    prisma.ordemServico.findMany({ where: { tenantId }, include: { cliente: true }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const receitaMensal = await prisma.lancamentoFinanceiro.findMany({
    where: { tenantId, tipo: "RECEITA", createdAt: { gte: inicio, lte: fim } },
    select: { valor: true, createdAt: true },
  });

  const diasMap: Record<number, number> = {};
  for (let d = 1; d <= new Date(fim.getFullYear(), fim.getMonth() + 1, 0).getDate(); d++) diasMap[d] = 0;
  receitaMensal.forEach((r) => {
    const dia = new Date(r.createdAt).getDate();
    diasMap[dia] += Number(r.valor);
  });

  return NextResponse.json({
    ordensAbertas,
    receitaMes: receitaMes._sum.valor || 0,
    totalClientes,
    totalPecas,
    statusCount,
    ultimasOrdens,
    receitaMensal: Object.entries(diasMap).map(([dia, receita]) => ({ dia: parseInt(dia), receita })),
  });
}
