import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { caixaId, itens, pagamentos, cliente, troco } = await req.json();

  const caixa = await prisma.caixa.findUnique({ where: { id: caixaId } });
  if (!caixa || caixa.fechamento) {
    return NextResponse.json({ error: "Caixa não está aberto" }, { status: 400 });
  }

  // Criar venda com os campos existentes
  const venda = await prisma.venda.create({
    data: {
      tenantId: session.user.tenantId,
      total: itens.reduce((acc: number, item: any) => acc + (item.precoVenda || item.preco || 0) * item.quantidade, 0),
      metodoPagamento: pagamentos.map((p: any) => p.metodo).join(", "),
      usuarioId: session.user.id,
      itens: {
        create: itens.map((item: any) => ({
          tipo: "PRODUTO",
          nome: item.nome,
          qtd: item.quantidade,
          preco: item.precoVenda || item.preco || 0,
        })),
      },
    },
  });

  return NextResponse.json({ success: true, vendaId: venda.id });
}
