import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarToken } from "@/lib/twoFactor";

export async function POST(req: NextRequest) {
  const { email, token } = await req.json();
  if (!email || !token) {
    return NextResponse.json({ error: "Email e token são obrigatórios" }, { status: 400 });
  }

  const user = await prisma.usuario.findFirst({ where: { email } });
  if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA não está ativo para este utilizador" }, { status: 400 });
  }

  const valido = verificarToken(user.twoFactorSecret, token);
  if (valido) {
    // Aqui pode gerar a sessão automaticamente
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Token inválido" }, { status: 401 });
}
