import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chatbotResposta } from "@/lib/chatbot";
import { incrementRequest } from "@/lib/chatbot-counter";
import { PERMISSOES } from "@/lib/permissoes";
import { NivelAcesso } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { pergunta } = await req.json();
  if (!pergunta || pergunta.length < 3) {
    return NextResponse.json({ resposta: "Faz uma pergunta mais específica sobre o AutoTrack." });
  }

  const { remaining, alert } = incrementRequest();
  console.log(`Contador: ${1500 - remaining}/1500 - Restam: ${remaining}`);

  if (remaining <= 0) {
    return NextResponse.json({ resposta: "Limite diário de pedidos atingido (1.500). Por favor, tenta novamente amanhã." });
  }

  const nivel = session.user.nivel || "CLIENTE";
  const modulosDisponiveis = PERMISSOES[nivel as NivelAcesso] || [];
  const resposta = await chatbotResposta(pergunta, {
    nome: session.user.name || "Utilizador",
    nivel,
    modulosDisponiveis,
  });

  return NextResponse.json({ resposta, remaining, alert });
}
