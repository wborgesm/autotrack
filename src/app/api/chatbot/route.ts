import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatbotResposta } from "@/lib/chatbot-simple";
import { chatbotResposta as chatbotGemini } from "@/lib/chatbot-gemini";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { pergunta, usarIA } = await req.json();
  if (!pergunta || pergunta.length < 2) {
    return NextResponse.json({ resposta: "Faz uma pergunta mais específica." });
  }

  let resposta: string;
  let fonte: string;
  let util: boolean | null = null;

  if (usarIA === true) {
    resposta = await chatbotGemini(pergunta, {
      nome: session.user.name || "Utilizador",
      nivel: session.user.nivel || "CLIENTE",
    });
    fonte = "gemini";
  } else {
    const resultado = chatbotResposta(pergunta);
    resposta = resultado.resposta;
    fonte = "conhecimento";
    util = !resultado.precisaIA;
  }

  // Registar log (assíncrono, não bloqueia a resposta)
  prisma.chatLog.create({
    data: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
      usuarioNome: session.user.name || "Anónimo",
      nivel: session.user.nivel,
      pergunta,
      resposta: resposta.substring(0, 1000), // limita tamanho
      fonte,
      util,
    },
  }).catch(err => console.error("Erro ao gravar log do chat:", err));

  return NextResponse.json({
    resposta,
    fonte,
    precisaIA: fonte === "conhecimento" ? util === false : false,
  });
}
