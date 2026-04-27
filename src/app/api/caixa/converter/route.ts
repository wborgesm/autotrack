import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { vendaId, acao } = await req.json();

  const venda = await prisma.venda.findFirst({
    where: { id: vendaId, tenantId: session.user.tenantId },
    include: { itens: true },
  });
  if (!venda) return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });

  if (acao === "criar_os") {
    const ultimo = await prisma.ordemServico.findFirst({ where: { tenantId: session.user.tenantId }, orderBy: { numero: "desc" }, select: { numero: true } });
    const os = await prisma.ordemServico.create({
      data: {
        tenantId: session.user.tenantId,
        numero: (ultimo?.numero || 0) + 1,
        status: "ABERTA",
        observacoes: `Convertida da venda do caixa em ${new Date().toLocaleString("pt-PT")}`,
        total: venda.total,
      } as any,
    });
    return NextResponse.json({ id: os.id, numero: os.numero });
  }

  if (acao === "gerar_fatura") {
    const fatura = await prisma.fatura.create({
      data: {
        tenantId: session.user.tenantId,
        numero: `FA ${new Date().getFullYear()}/${Date.now()}`,
        clienteId: "manual",
        total: venda.total,
        iva: 23,
        nifEmpresa: "999999999",
        emitida: false,
      },
    });
    return NextResponse.json({ id: fatura.id, numero: fatura.numero });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
