import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { pergunta, resposta, util } = await req.json();
  
  // Encontra o último log deste utilizador com esta pergunta
  const log = await prisma.chatLog.findFirst({
    where: {
      usuarioId: session.user.id,
      pergunta: pergunta || "",
    },
    orderBy: { createdAt: "desc" },
  });

  if (log) {
    await prisma.chatLog.update({
      where: { id: log.id },
      data: { util: util === true },
    });
  }

  return NextResponse.json({ success: true });
}
