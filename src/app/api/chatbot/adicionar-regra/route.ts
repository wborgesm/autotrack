import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.chaves || !Array.isArray(body.chaves)) {
    return NextResponse.json({ error: "Chaves obrigatórias" }, { status: 400 });
  }

  // Aqui poderíamos editar o ficheiro chatbot-simple.ts, mas para já apenas registamos a sugestão.
  // O admin pode copiar as chaves e adicioná-las manualmente.
  console.log("Nova regra sugerida:", body);

  // Retornamos uma mensagem de sucesso com as instruções
  return NextResponse.json({
    message: `Regra com chaves [${body.chaves.join(", ")}] registada. Adiciona manualmente em src/lib/chatbot-simple.ts.`,
    sugestao: {
      chaves: body.chaves,
      resposta: body.resposta || "",
      modoAula: body.modoAula || ""
    }
  });
}
