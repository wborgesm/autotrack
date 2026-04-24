import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["SUPER_ADMIN", "ADMIN", "GERENTE", "RECEPCIONISTA"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: params.id, tenantId },
    include: { itens: true },
  });

  if (!orcamento) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  if (orcamento.status === "CONVERTIDO") return NextResponse.json({ error: "Orçamento já convertido" }, { status: 400 });
  if (!orcamento.veiculoId || !orcamento.clienteId) return NextResponse.json({ error: "Orçamento não tem cliente/veículo associado" }, { status: 400 });

  const ultimaOS = await prisma.ordemServico.findFirst({
    where: { tenantId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const proximoNumero = (ultimaOS?.numero ?? 0) + 1;

  const ordem = await prisma.ordemServico.create({
    data: {
      tenantId,
      numero: proximoNumero,
      clienteId: orcamento.clienteId,
      veiculoId: orcamento.veiculoId,
      status: "ABERTA",
      observacoes: orcamento.descricao ?? `Convertida do orçamento #${orcamento.numero}`,
      total: orcamento.total,
      itens: {
        create: orcamento.itens
          .filter((item: any) => item.tipo === "SERVICO")
          .map((item: any) => ({
            servicoId: item.servicoId!,
            quantidade: item.quantidade,
            valorUnit: item.valorUnit,
            desconto: item.desconto,
            total: item.total,
          })),
      },
      itensPeca: {
        create: orcamento.itens
          .filter((item: any) => item.tipo === "PECA")
          .map((item: any) => ({
            pecaId: item.pecaId!,
            quantidade: item.quantidade,
            valorUnit: item.valorUnit,
            desconto: item.desconto,
            total: item.total,
          })),
      },
    },
  });

  await prisma.orcamento.update({
    where: { id: orcamento.id },
    data: { status: "CONVERTIDO" },
  });

  return NextResponse.json({ id: ordem.id, numero: ordem.numero });
}
