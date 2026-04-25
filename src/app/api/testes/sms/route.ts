import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { enviarSMS } from "@/lib/sms-gateway";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { telefone, mensagem } = await req.json();
  if (!telefone || !mensagem) {
    return NextResponse.json({ error: "Telefone e mensagem são obrigatórios" }, { status: 400 });
  }

  const resultado = await enviarSMS(telefone, mensagem);
  return NextResponse.json(resultado);
}
