import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { podeGerenciarOrdem } from "@/lib/permissoes";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  const tipo = req.nextUrl.searchParams.get("tipo");

  const ordem = await prisma.ordemServico.findFirst({ where: { id: params.id, tenantId } });
  if (!ordem) return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
  if (!podeGerenciarOrdem(session.user.nivel, session.user.id, ordem.tecnicoId, ordem.usuarioId)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    if (tipo === "servico") {
      await prisma.itemOrdem.delete({ where: { id: params.itemId } });
    } else if (tipo === "peca") {
      const item = await prisma.itemPecaOrdem.findUnique({ where: { id: params.itemId } });
      if (item) {
        // Devolver ao stock
        await prisma.peca.update({ where: { id: item.pecaId }, data: { qtdEstoque: { increment: item.quantidade } } });
        await prisma.movimentoEstoque.create({
          data: { tenantId, pecaId: item.pecaId, tipo: "ENTRADA", quantidade: item.quantidade, custo: item.valorUnit, ordemId: params.id, observacoes: "Devolução por remoção da OS" },
        });
      }
      await prisma.itemPecaOrdem.delete({ where: { id: params.itemId } });
    }
    await atualizarTotais(params.id);
    return NextResponse.json({ success: true });
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
  await prisma.ordemServico.update({ where: { id: ordemId }, data: { totalMaoObra, totalPecas, total } });
}
