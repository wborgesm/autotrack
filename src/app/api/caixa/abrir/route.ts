import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { saldoInicial } = await req.json();

  // Verificar se já existe caixa aberto para este utilizador (sem campo 'status')
  const caixaAberto = await prisma.caixa.findFirst({
    where: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
      fechamento: null, // Caixa aberto: sem data de fechamento
    },
  });
  if (caixaAberto) {
    return NextResponse.json({ error: "Já existe um caixa aberto" }, { status: 400 });
  }

  const caixa = await prisma.caixa.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
      saldoInicial: saldoInicial || 0,
      abertura: new Date(),
    },
  });

  return NextResponse.json({ id: caixa.id, aberto: true });
}
