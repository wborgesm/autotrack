const API_KEY = process.env.GEMINI_API_KEY;
// Modelos gratuitos disponíveis (fallback automático)
const MODELS = ["gemini-1.5-flash-8b", "gemini-2.0-flash", "gemini-1.5-flash"];

async function tryChatCompletion(prompt: string, systemPrompt: string): Promise<string | null> {
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await res.json();

      if (data.candidates) {
        const texto = data.candidates[0]?.content?.parts?.[0]?.text;
        if (texto) return texto;
      }

      if (data.error) {
        console.warn(`Modelo ${model} falhou:`, data.error.message);
        // Se for quota, tenta o próximo modelo
        if (data.error.status === "RESOURCE_EXHAUSTED") continue;
        // Outros erros (chave inválida, etc.) param aqui
        console.error("Erro da API Gemini:", data.error);
        return `Erro da API: ${data.error.message || "Erro desconhecido"}.`;
      }
    } catch (e) {
      console.error(`Erro de rede no modelo ${model}:`, e);
      continue;
    }
  }
  return null;
}

function buildSystemPrompt(contexto: {
  nome?: string;
  nivel?: string;
  modulosDisponiveis?: string[];
}): string {
  const nivel = contexto.nivel || "utilizador";
  const modulos = contexto.modulosDisponiveis?.join(", ") || "todos os módulos";

  return `ÉS o assistente virtual oficial do **AutoTrack**, um sistema SaaS completo de gestão para oficinas mecânicas em Portugal.
O teu propósito é **EXCLUSIVAMENTE** ajudar utilizadores a usar o sistema. NUNCA dês informações externas ao AutoTrack.

**REGRAS OBRIGATÓRIAS:**
1. NUNCA reveles dados pessoais, financeiros, ou informações sensíveis de clientes, veículos, ou da oficina.
2. NUNCA consultes a base de dados real — se te perguntarem "quantas OS tenho?", explica como podem ver isso no dashboard.
3. Responde APENAS a perguntas sobre o funcionamento do sistema, módulos, funcionalidades, e boas práticas de oficina.
4. Se a pergunta for sobre algo fora do âmbito do sistema, responde educadamente que só podes ajudar com o AutoTrack.
5. Adapta as tuas respostas ao nível do utilizador. O utilizador atual tem nível "${nivel}" e acesso aos módulos: ${modulos}. Se ele perguntar sobre algo a que não tem acesso, informa que essa funcionalidade não está disponível para o seu perfil e sugere contactar um administrador.
6. Sê conciso, amigável e útil.
7. Responde sempre em português de Portugal.
8. Usa **negrito** para destacar nomes de módulos e funcionalidades importantes.
9. Quando relevante, menciona o **caminho do menu** (ex: "Vai a **Ordens > Nova OS**").

## 📚 CONHECIMENTO COMPLETO DO AUTOTRACK
... (manter o texto completo de conhecimento do sistema, omitido aqui por brevidade) ...
`;
}

export async function chatbotResposta(
  pergunta: string,
  contexto: {
    nome?: string;
    nivel?: string;
    modulosDisponiveis?: string[];
  }
): Promise<string> {
  if (!API_KEY) return "Chatbot não configurado. Contacta o administrador.";

  const systemPrompt = buildSystemPrompt(contexto);
  const resultado = await tryChatCompletion(pergunta, systemPrompt);

  if (resultado) return resultado;

  return "Não consegui processar a tua pergunta — os modelos de IA estão temporariamente sobrecarregados. Aguarda uns minutos e tenta novamente. Se o problema persistir, contacta o administrador.";
}
