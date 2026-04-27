import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { itens, metodoPagamento, valorRecebido } = await req.json();
  const total = itens.reduce((sum: number, i: any) => sum + i.preco * i.qtd, 0);
  const venda = await prisma.venda.create({
    data: {
      tenantId: session.user.tenantId,
      total,
      metodoPagamento,
      itens: { create: itens.map((i: any) => ({ tipo: i.tipo, nome: i.nome, qtd: i.qtd, preco: i.preco })) },
      usuarioId: session.user.id,
    },
  });
  return NextResponse.json(venda);
}
