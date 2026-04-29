import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const caixa = await prisma.caixa.findFirst({
    where: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
      fechamento: null,
    },
    orderBy: { abertura: "desc" },
  });

  return NextResponse.json({ aberto: !!caixa, caixaId: caixa?.id });
}
