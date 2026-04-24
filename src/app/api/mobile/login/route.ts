import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 });
    }

    const user = await prisma.usuario.findFirst({
      where: { email, ativo: true },
      include: { tenant: { select: { id: true, nome: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const senhaValida = await bcrypt.compare(password, user.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        nivel: user.nivel,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        nivel: user.nivel,
        avatar: user.avatar,
      },
      tenant: {
        id: user.tenant.id,
        nome: user.tenant.nome,
      },
    });
  } catch (error) {
    console.error("Erro no login mobile:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
