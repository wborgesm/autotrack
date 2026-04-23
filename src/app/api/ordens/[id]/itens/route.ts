import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { podeGerenciarOrdem } from "@/lib/permissoes";
import { z } from "zod";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;

  const ordem = await prisma.ordemServico.findFirst({ where: { id: params.id, tenantId } });
  if (!ordem) return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
  if (!podeGerenciarOrdem(session.user.nivel, session.user.id, ordem.tecnicoId, ordem.usuarioId)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const body = await req.json();
  const { tipo, servicoId, pecaId, quantidade, valorUnit } = body;

  try {
    if (tipo === "servico") {
      const item = await prisma.itemOrdem.create({
        data: {
          ordemId: params.id,
          servicoId,
          quantidade,
          valorUnit,
          total: quantidade * valorUnit,
        },
      });
      await atualizarTotais(params.id);
      return NextResponse.json(item, { status: 201 });
    } else if (tipo === "peca") {
      const item = await prisma.itemPecaOrdem.create({
        data: {
          ordemId: params.id,
          pecaId,
          quantidade,
          valorUnit,
          total: quantidade * valorUnit,
        },
      });
      // Dar baixa no stock (saída)
      await prisma.peca.update({
        where: { id: pecaId },
        data: { qtdEstoque: { decrement: quantidade } },
      });
      await prisma.movimentoEstoque.create({
        data: {
          tenantId,
          pecaId,
          tipo: "SAIDA",
          quantidade,
          custo: valorUnit,
          ordemId: params.id,
        },
      });
      await atualizarTotais(params.id);
      return NextResponse.json(item, { status: 201 });
    }
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function atualizarTotais(ordemId: string) {
  const [servicos, pecas] = await Promise.all([
    prisma.itemOrdem.aggregate({ where: { ordemId }, _sum: { total: true } }),
    prisma.itemPecaOrdem.aggregate({ where: { ordemId }, _sum: { total: true } }),
  ]);
  const totalMaoObra = servicos._sum.total?.toNumber() || 0;
  const totalPecas = pecas._sum.total?.toNumber() || 0;
  const total = totalMaoObra + totalPecas;
  await prisma.ordemServico.update({
    where: { id: ordemId },
    data: { totalMaoObra, totalPecas, total },
  });
}
