import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { caixaId, contagemReal, diferenca, justificativa } = await req.json();

  // Fechar o caixa
  await prisma.caixa.update({
    where: { id: caixaId },
    data: { fechamento: new Date() },
  });

  // Registar auditoria do fecho
  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
      usuarioNome: session.user.name || "Sistema",
      acao: "Fecho de caixa",
      entidade: "Caixa",
      entidadeId: caixaId,
      dadosNovos: {
        contagemReal,
        diferenca,
        justificativa: justificativa || null,
        dataFecho: new Date().toISOString(),
      },
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
