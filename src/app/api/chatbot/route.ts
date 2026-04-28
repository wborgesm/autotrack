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

  // Contador de pedidos
  const { remaining, alert } = incrementRequest();

  // Se atingiu o limite, não faz mais pedidos
  if (remaining <= 0) {
    return NextResponse.json({ resposta: "Limite diário de pedidos atingido (1.500). Por favor, tenta novamente amanhã." });
  }

  // Alerta para o administrador quando estiver perto do limite
  if (alert) {
    console.warn(`⚠️ ALERTA: Já foram feitos ${1500 - remaining} pedidos ao chatbot hoje. Restam ${remaining}.`);
  }

  // Verificar palavras proibidas (dados sensíveis)
  const palavrasProibidas = [
    "nif", "cpf", "telefone", "email de cliente", "matricula", "placa",
    "quanto pagou", "divida", "saldo", "lucro", "fatura do cliente",
    "morada", "endereco", "dados do cliente", "quantas OS", "quantos clientes"
  ];
  const perguntaLower = pergunta.toLowerCase();
  for (const palavra of palavrasProibidas) {
    if (perguntaLower.includes(palavra)) {
      return NextResponse.json({
        resposta: "Não posso fornecer informações específicas sobre clientes, veículos ou dados financeiros. Para consultar esses dados, utiliza os relatórios e listagens disponíveis no menu correspondente, de acordo com o teu nível de acesso.",
        remaining,
        alert: false
      });
    }
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
