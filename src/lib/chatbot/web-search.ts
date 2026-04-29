export interface ResultadoPesquisa {
  encontrou: boolean;
  resposta?: string;
  fonte?: string;
  fonteUrl?: string;
  sugestoes?: string[];
}

function extrairTermoChave(pergunta: string): string {
  const stopWords = ["o que é", "o que sao", "quem é", "qual é", "como", "porque", "para que serve", "significado de", "defina", "definição de"];
  let termo = pergunta.toLowerCase();
  for (const sw of stopWords) {
    termo = termo.replace(sw, "");
  }
  return termo.replace(/[?¿!.,]/g, "").trim().split(" ").slice(0, 5).join(" ");
}

export async function pesquisarDuckDuckGo(pergunta: string): Promise<ResultadoPesquisa> {
  const tentar = async (query: string) => {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "pt-PT,pt;q=0.9" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.AbstractText?.length > 20) {
      return {
        encontrou: true as const,
        resposta: data.AbstractText.slice(0, 500),
        fonte: data.AbstractSource || "DuckDuckGo",
        fonteUrl: data.AbstractURL || undefined,
      };
    }
    if (data.Definition?.length > 10) {
      return {
        encontrou: true as const,
        resposta: data.Definition,
        fonte: data.DefinitionSource || "DuckDuckGo",
        fonteUrl: data.DefinitionURL || undefined,
      };
    }
    if (data.Answer?.toString().length) {
      return {
        encontrou: true as const,
        resposta: String(data.Answer),
        fonte: "DuckDuckGo",
      };
    }
    const sugestoes = data.RelatedTopics?.slice(0, 4)
      .filter((t: any) => t.Text?.length)
      .map((t: any) => t.Text.slice(0, 120));
    if (sugestoes?.length) {
      return {
        encontrou: true as const,
        resposta: sugestoes.join("\n\n"),
        fonte: "DuckDuckGo",
        sugestoes,
      };
    }
    return null;
  };

  try {
    // 1. Tentar com a pergunta completa
    const resultado = await tentar(pergunta.trim());
    if (resultado) return resultado;

    // 2. Fallback: termo mais curto
    const termoChave = extrairTermoChave(pergunta);
    if (termoChave.length > 2 && termoChave !== pergunta.trim()) {
      const resultado2 = await tentar(termoChave);
      if (resultado2) return resultado2;
    }
  } catch {}

  return { encontrou: false };
}
