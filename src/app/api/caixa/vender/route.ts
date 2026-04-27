import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { itens, metodoPagamento, valorRecebido } = await req.json();
  const total = itens.reduce((sum: number, i: any) => sum + i.preco * i.qtd, 0);

  // Criar a venda
  const venda = await prisma.venda.create({
    data: {
      tenantId: session.user.tenantId,
      total,
      metodoPagamento: metodoPagamento || "DINHEIRO",
      itens: { create: itens.map((i: any) => ({ tipo: i.tipo, nome: i.nome, qtd: i.qtd, preco: i.preco })) },
      usuarioId: session.user.id,
    },
  });

  // Criar lançamento financeiro automático (receita)
  await prisma.lancamentoFinanceiro.create({
    data: {
      tenantId: session.user.tenantId,
      tipo: "RECEITA",
      descricao: `Venda no caixa #${venda.id.slice(-6)}`,
      valor: total,
      data: new Date(),
      pago: true,
      categoria: "Caixa",
    },
  });

  // Atualizar stock dos produtos (somente itens do tipo "produto")
  for (const item of itens) {
    if (item.tipo === "produto" && item.id) {
      const peca = await prisma.peca.findFirst({ where: { id: item.id, tenantId: session.user.tenantId } });
      if (peca) {
        const novoStock = Number(peca.qtdEstoque) - item.qtd;
        if (novoStock >= 0) {
          await prisma.peca.update({
            where: { id: peca.id },
            data: { qtdEstoque: novoStock },
          });
        }
        // Se stock insuficiente, ainda permite a venda mas não mexe no stock
      }
    }
  }

  return NextResponse.json(venda);
}
