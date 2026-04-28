const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = "deepseek-r1:1.5b";

function buildSystemPrompt(contexto: {
  nome?: string;
  nivel?: string;
  modulosDisponiveis?: string[];
}): string {
  const nivel = contexto.nivel || "utilizador";
  const modulos = contexto.modulosDisponiveis?.join(", ") || "todos os módulos";

  return `ÉS o assistente virtual oficial do **AutoTrack**, um sistema SaaS completo de gestão para oficinas mecânicas.
O teu propósito é **EXCLUSIVAMENTE** ajudar utilizadores a usar o sistema.
**REGRAS OBRIGATÓRIAS:**
1. NUNCA reveles dados sensíveis.
2. Responde APENAS sobre o AutoTrack.
3. Adapta ao nível do utilizador: "${nivel}" com acesso a: ${modulos}.
4. Responde em português de Portugal.
5. Sê conciso e útil.`;
}

export async function chatbotResposta(
  pergunta: string,
  contexto: {
    nome?: string;
    nivel?: string;
    modulosDisponiveis?: string[];
  }
): Promise<string> {
  try {
    const systemPrompt = buildSystemPrompt(contexto);
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: pergunta },
        ],
        stream: false,
      }),
    });

    const data = await res.json();
    return data.message?.content || "Não consegui processar a tua pergunta.";
  } catch (error) {
    console.error("Erro no chatbot local:", error);
    return "Erro ao contactar o assistente local. Verifica se o Ollama está a correr.";
  }
}
