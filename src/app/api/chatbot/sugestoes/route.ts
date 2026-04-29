import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const perguntasOrfas = await prisma.chatLog.groupBy({
    by: ["pergunta"],
    where: {
      tenantId: session.user.tenantId,
      OR: [
        { matched: false },
        { util: false }
      ]
    },
    _count: { pergunta: true },
    orderBy: { _count: { pergunta: "desc" } },
    take: 20,
  });

  return NextResponse.json(perguntasOrfas);
}
