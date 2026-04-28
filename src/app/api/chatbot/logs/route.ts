import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const top = searchParams.get("top");
  const fonte = searchParams.get("fonte") || undefined;

  // Se pediu top perguntas
  if (top) {
    const limit = parseInt(top) || 10;
    const topPerguntas = await prisma.chatLog.groupBy({
      by: ["pergunta"],
      _count: { pergunta: true },
      orderBy: { _count: { pergunta: "desc" } },
      take: limit,
    });
    return NextResponse.json({
      topPerguntas: topPerguntas.map(p => ({
        pergunta: p.pergunta.length > 60 ? p.pergunta.substring(0, 60) + "..." : p.pergunta,
        count: p._count.pergunta,
      })),
    });
  }

  // Estatísticas gerais
  const where: any = {};
  if (fonte) where.fonte = fonte;

  const [totalPerguntas, respondidas, naoRespondidas, comIA, totalUtilizadores] = await Promise.all([
    prisma.chatLog.count(),
    prisma.chatLog.count({ where: { util: true } }),
    prisma.chatLog.count({ where: { util: false } }),
    prisma.chatLog.count({ where: { fonte: "gemini" } }),
    prisma.chatLog.groupBy({ by: ["usuarioId"], _count: true }).then(r => r.length),
  ]);

  const logs = await prisma.chatLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const taxaResolucao = totalPerguntas > 0 ? Math.round((respondidas / totalPerguntas) * 100) : 0;

  return NextResponse.json({
    logs,
    stats: { totalPerguntas, respondidas, naoRespondidas, comIA, taxaResolucao, totalUtilizadores },
  });
}
