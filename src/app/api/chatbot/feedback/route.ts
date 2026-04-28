import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { pergunta, resposta, util } = await req.json();
  
  // Atualiza o último log do chat com a avaliação
  await prisma.chatLog.updateMany({
    where: {
      usuarioId: session.user.id,
      pergunta: pergunta || "",
    },
    data: {
      util: util === true,
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  return NextResponse.json({ success: true });
}
