import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "src/lib/chatbot-simple.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  const aulas: any[] = [];
  const aulaRegex = /(\w+):\s*\{[^}]+id:\s*"([^"]+)",[^}]+titulo:\s*"([^"]+)"/g;
  let match;
  while ((match = aulaRegex.exec(content)) !== null) {
    aulas.push({ id: match[2], titulo: match[3], key: match[1] });
  }

  const respostasCount = (content.match(/chaves:\s*\[/g) || []).length;
  const sinonimosCount = (content.match(/"([^"]+)"/g) || []).length;

  return NextResponse.json({
    nome: "AutoTrack Chatbot",
    versao: "1.0",
    data_exportacao: new Date().toISOString(),
    estrutura: {
      aulas: aulas,
      total_aulas: aulas.length,
      respostas_diretas: respostasCount,
      sinonimos_aproximados: sinonimosCount,
      pesquisa_web: "DuckDuckGo Instant Answer API (grátis)",
      cache_ia: "ChatCache",
      feedback: "ChatLog.util",
    },
    aulas_detalhe: aulas.map(a => ({
      id: a.id,
      titulo: a.titulo,
      chave: a.key,
    })),
    proximos_passos_sugeridos: [
      "Adicionar mais sinónimos PT-BR",
      "Criar aula para 'Devoluções'",
      "Melhorar detecção de intenção com IA",
      "Adicionar suporte a múltiplos idiomas",
    ],
  });
}
