import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pesquisarDuckDuckGo } from "@/lib/chatbot/web-search";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ error: "Pesquisa inválida" }, { status: 400 });
    }

    const querySegura = query.trim().slice(0, 200);
    const resultado = await pesquisarDuckDuckGo(querySegura);

    if (!resultado.encontrou) {
      return NextResponse.json({
        resposta: `Não encontrei informação sobre "${querySegura}".\n\nTenta em:\n🔍 [DuckDuckGo](https://duckduckgo.com/?q=${encodeURIComponent(querySegura)}) ou [Google](https://google.com/search?q=${encodeURIComponent(querySegura)})`,
        encontrou: false,
      });
    }

    let resposta = `🌐 **Resultado:**\n\n${resultado.resposta}`;
    if (resultado.fonte) {
      resposta += `\n\n📎 Fonte: ${resultado.fonteUrl ? `[${resultado.fonte}](${resultado.fonteUrl})` : resultado.fonte}`;
    }
    resposta += `\n\n🔍 [Ver mais](https://duckduckgo.com/?q=${encodeURIComponent(querySegura)})`;

    return NextResponse.json({ resposta, encontrou: true });
  } catch {
    return NextResponse.json({ error: "Erro na pesquisa" }, { status: 500 });
  }
}
