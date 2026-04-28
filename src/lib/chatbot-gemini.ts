import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash";

function loadKnowledge(): string {
  const filePath = path.join(process.cwd(), "src", "lib", "chatbot-knowledge.md");
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "Conhecimento do AutoTrack não disponível.";
  }
}

export async function chatbotResposta(
  pergunta: string,
  contexto: { nome?: string; nivel?: string }
): Promise<string> {
  if (!API_KEY) return "Assistente IA não configurado. Contacta o administrador.";

  const knowledge = loadKnowledge();
  const systemPrompt = `${knowledge}

---
Responde com base APENAS no documento acima. O utilizador tem nível "${contexto.nivel}".
Se a pergunta não estiver coberta, sê honesto e diz que não sabes.`;

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
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar a tua pergunta.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Erro ao contactar a IA. Tenta novamente.";
  }
}
