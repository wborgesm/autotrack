import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NivelAcesso } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const nivel = session.user.nivel;
  const tenantId = session.user.tenantId;

  // SUPER_ADMIN vê todos os utilizadores de todos os tenants
  if (nivel === "SUPER_ADMIN") {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, nivel: true, ativo: true, tenantId: true, createdAt: true },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(usuarios);
  }

  // ADMIN vê apenas utilizadores do seu tenant (exceto SUPER_ADMIN)
  if (nivel === "ADMIN" && tenantId) {
    const usuarios = await prisma.usuario.findMany({
      where: {
        tenantId,
        nivel: { not: "SUPER_ADMIN" }, // esconde o SUPER_ADMIN do ADMIN
      },
      select: { id: true, nome: true, email: true, nivel: true, ativo: true, createdAt: true },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(usuarios);
  }

  // Outros níveis não têm acesso
  return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const nivel = session.user.nivel;
  const tenantId = session.user.tenantId;

  if (!["SUPER_ADMIN", "ADMIN"].includes(nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const { nome, email, senha, nivel: nivelAlvo } = await req.json();
  if (!nome || !email || !senha) {
    return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 });
  }

  // ADMIN força o seu tenantId
  const targetTenantId = tenantId;

  const existente = await prisma.usuario.findFirst({ where: { email } });
  if (existente) return NextResponse.json({ error: "Email já registado" }, { status: 400 });

  const hash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: hash,
      nivel: nivelAlvo || "GERENTE",
      tenantId: targetTenantId,
      ativo: true,
    },
    select: { id: true, nome: true, email: true, nivel: true, ativo: true, createdAt: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}
