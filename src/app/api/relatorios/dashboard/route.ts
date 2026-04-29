import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOS,
    osAnteriores,
    osPorEstado,
    faturacaoMes,
    faturacaoAnterior,
    stockCritico,
    tecnicosActivos,
    ultimasOS
  ] = await Promise.all([
    prisma.ordemServico.count({ where: { tenantId } }),
    prisma.ordemServico.count({ where: { tenantId, createdAt: { lt: inicioMes } } }),
    prisma.ordemServico.groupBy({ by: ["status"], where: { tenantId, createdAt: { gte: inicioMes } }, _count: true }),
    prisma.ordemServico.aggregate({ _sum: { total: true }, where: { tenantId, createdAt: { gte: inicioMes } } }),
    prisma.ordemServico.aggregate({ _sum: { total: true }, where: { tenantId, createdAt: { gte: mesAnterior, lt: inicioMes } } }),
    prisma.peca.count({ where: { tenantId, qtdEstoque: { lte: (await prisma.peca.findFirst({ where: { tenantId }, select: { qtdMinima: true } }))?.qtdMinima ?? 0 } } }),
    prisma.tecnico.count({ where: { tenantId, ativo: true } }),
    prisma.ordemServico.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, numero: true, status: true, createdAt: true,
        cliente: { select: { nome: true } },
        veiculo: { select: { placa: true } },
      },
    }),
  ]);

  // Corrigir contagem de stock crítico (peças onde qtdEstoque <= qtdMinima)
  const pecasCriticas = await prisma.peca.count({
    where: { tenantId, qtdEstoque: { lte: prisma.peca.fields.qtdMinima } },
  });

  const totalFaturacaoMes = faturacaoMes._sum.total?.toNumber() || 0;
  const totalFaturacaoAnterior = faturacaoAnterior._sum.total?.toNumber() || 0;
  const tendenciaOS = osAnteriores > 0 ? ((totalOS - osAnteriores) / osAnteriores) * 100 : 0;
  const tendenciaFaturacao = totalFaturacaoAnterior > 0
    ? ((totalFaturacaoMes - totalFaturacaoAnterior) / totalFaturacaoAnterior) * 100
    : 0;

  const estados = osPorEstado.reduce((acc: any, curr: any) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {});

  return NextResponse.json({
    osAbertas: totalOS,
    tendenciaOS: Math.round(tendenciaOS * 10) / 10,
    faturacaoMes: totalFaturacaoMes,
    tendenciaFaturacao: Math.round(tendenciaFaturacao * 10) / 10,
    stockCritico: pecasCriticas,
    tecnicosActivos,
    osPorEstado: estados,
    ultimasOS,
  });
}
