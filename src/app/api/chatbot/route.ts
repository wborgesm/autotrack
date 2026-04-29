import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatbotResposta } from "@/lib/chatbot-simple";
import { chatbotResposta as chatbotGemini } from "@/lib/chatbot-gemini";
import { getCachedResposta, setCachedResposta } from "@/lib/chatbot-cache";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { pergunta, usarIA } = await req.json();
  if (!pergunta || pergunta.length < 2) {
    return NextResponse.json({ resposta: "Faz uma pergunta mais específica." });
  }

  let resposta: string;
  let fonte: string;
  let matched: boolean;

  if (usarIA === true) {
    // Verificar cache antes de chamar a IA
    const cached = await getCachedResposta(pergunta);
    if (cached) {
      resposta = cached;
      console.log("Cache hit para:", pergunta);
    } else {
      resposta = await chatbotGemini(pergunta, {
        nome: session.user.name || "Utilizador",
        nivel: session.user.nivel || "CLIENTE",
      });
      await setCachedResposta(pergunta, resposta);
    }
    fonte = "gemini";
    matched = false;
  } else {
    const resultado = chatbotResposta(pergunta);
    resposta = resultado.resposta;
    fonte = "conhecimento";
    matched = true;
  }

  // Registar log com o campo matched
  prisma.chatLog.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
      usuarioNome: session.user.name || "Anónimo",
      nivel: session.user.nivel,
      pergunta,
      resposta: resposta.substring(0, 1000),
      fonte,
      matched,
      util: matched ? true : null, // se veio das regras, assume-se útil; senão, sem feedback
    },
  }).catch(err => console.error("Erro ao gravar log do chat:", err));

  return NextResponse.json({
    resposta,
    fonte,
    precisaIA: !matched,
  });
}
