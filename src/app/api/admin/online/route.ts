import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cincoMinAtras = new Date(Date.now() - 5 * 60 * 1000);
  const sessoes = await prisma.sessao.findMany({
    where: { updatedAt: { gte: cincoMinAtras } },
    include: {
      usuario: { select: { nome: true, email: true, tenant: { select: { nome: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const resultado = sessoes.map(s => ({
    ip: s.ip,
    usuario: s.usuario?.nome || s.userId,
    tenant: s.usuario?.tenant?.nome || "Desconhecida",
    ultimaAtividade: s.updatedAt.toISOString(),
  }));

  return NextResponse.json({ online: resultado.length, sessoes: resultado });
}
