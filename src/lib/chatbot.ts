const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash";

export async function chatbotResposta(
  pergunta: string,
  contexto: {
    nome?: string;
    nivel?: string;
    modulosDisponiveis?: string[];
  }
): Promise<string> {
  if (!API_KEY) return "Chatbot não configurado. Configure GEMINI_API_KEY no .env.";

  const modulos = contexto.modulosDisponiveis?.join(", ") || "todos os módulos";

  const systemPrompt = `És o assistente virtual do AutoTrack, um sistema de gestão para oficinas mecânicas.
O teu propósito é **exclusivamente** ajudar utilizadores a usar o sistema.

**Regras OBRIGATÓRIAS:**
1. NUNCA reveles dados pessoais, financeiros, ou informações sensíveis de clientes, veículos, ou da oficina.
2. NUNCA consultes a base de dados real — se te perguntarem "quantas OS tenho?", explica como podem ver isso no dashboard.
3. Responde APENAS a perguntas sobre o funcionamento do sistema, módulos, funcionalidades, e boas práticas de oficina.
4. Se a pergunta for sobre algo fora do âmbito do sistema, responde educadamente que só podes ajudar com o AutoTrack.
5. Adapta as tuas respostas ao nível do utilizador. O utilizador atual tem nível "${contexto.nivel || "utilizador"}" e acesso aos módulos: ${modulos}. Se ele perguntar sobre algo a que não tem acesso, informa que essa funcionalidade não está disponível para o seu perfil e sugere contactar um administrador.
6. Sê conciso, amigável e útil.
7. Responde sempre em português de Portugal.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: pergunta }] }],
        }),
      }
    );

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpa, não consegui processar a tua pergunta.";
  } catch (error) {
    console.error("Erro no chatbot:", error);
    return "Erro ao contactar o assistente. Tenta novamente.";
  }
}
