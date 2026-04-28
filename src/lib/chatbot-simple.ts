import fs from "fs";
import path from "path";
import { normalizeQuestion, extractKeywords } from "./chatbot-synonyms";
import { aleatorio, saudacoes, naoEntendi, confirmacoes, erros, sugestoes, finalizacao } from "./chatbot-frases";

let knowledgeCache: string | null = null;

function loadKnowledge(): string {
  if (knowledgeCache) return knowledgeCache;
  const filePath = path.join(process.cwd(), "src", "lib", "chatbot-knowledge.md");
  try {
    knowledgeCache = fs.readFileSync(filePath, "utf-8");
  } catch {
    knowledgeCache = "Conhecimento do AutoTrack não disponível.";
  }
  return knowledgeCache;
}

function searchKnowledge(question: string): string | null {
  const knowledge = loadKnowledge();
  const normalizedQuestion = normalizeQuestion(question);
  const keywords = extractKeywords(normalizedQuestion);
  
  const sections = knowledge.split(/\n(?=## |### )/);
  const scored = sections.map(section => {
    const sectionLower = section.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      const matches = sectionLower.match(regex);
      if (matches) score += matches.length * 10;
      const title = section.split('\n')[0].toLowerCase();
      if (title.includes(keyword)) score += 50;
    }
    return { section, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  if (scored.length > 0 && scored[0].score > 0) {
    let result = scored[0].section.trim();
    // Limita tamanho e remove títulos técnicos
    result = result
      .replace(/^## .*\n?/gm, '')
      .replace(/^### .*\n?/gm, '')
      .replace(/^---.*\n?/gm, '')
      .trim();
    if (result.length > 400) {
      result = result.substring(0, 400) + "\n\n_Para mais detalhes, consulta o menu correspondente._";
    }
    return result;
  }
  
  // Procura no FAQ
  const faqSection = knowledge.split("## ❓ PERGUNTAS FREQUENTES")[1];
  if (faqSection) {
    const faqItems = faqSection.split("### P:");
    for (const item of faqItems) {
      if (item.length < 10) continue;
      const itemLower = item.toLowerCase();
      let score = 0;
      for (const keyword of keywords) {
        if (itemLower.includes(keyword)) score += 5;
      }
      if (score > 0) {
        let faqAnswer = item.trim();
        // Extrai apenas a resposta (após o "R:")
        const answerMatch = faqAnswer.match(/\*\*R:\*\*\s*(.*)/);
        if (answerMatch) {
          faqAnswer = answerMatch[1].trim();
        }
        if (faqAnswer.length > 400) {
          faqAnswer = faqAnswer.substring(0, 400) + "...";
        }
        return faqAnswer;
      }
    }
  }
  
  return null;
}

export function chatbotResposta(pergunta: string): { resposta: string; precisaIA: boolean } {
  const result = searchKnowledge(pergunta);
  
  if (result) {
    // Embrulha a resposta do conhecimento num formato mais humano
    const confirmation = aleatorio(confirmacoes);
    const sugestao = aleatorio(sugestoes);
    const final = aleatorio(finalizacao);
    
    const respostaFormatada = `${result}\n\n${sugestao}\n${final}`;
    return { resposta: respostaFormatada, precisaIA: false };
  }
  
  // Resposta padrão quando não encontra nada
  const naoEntendeu = aleatorio(naoEntendi);
  const sugestao1 = aleatorio(sugestoes);
  const sugestao2 = aleatorio(sugestoes);
  
  return {
    resposta: `${naoEntendeu}\n\n**Sugestões:**\n- ${sugestao1}\n- ${sugestao2}\n\nSe precisares de mais ajuda, um administrador pode ajudar.`,
    precisaIA: true
  };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
