import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";
import bcrypt from "bcryptjs";

// GET – Listar utilizadores do tenant (ADMIN só vê os seus)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tenantId = session.user.tenantId;
  const nivel = session.user.nivel;

  // SUPER_ADMIN vê todos; outros só veem o seu tenant
  const where: any = nivel === "SUPER_ADMIN" ? {} : { tenantId };

  const usuarios = await prisma.usuario.findMany({
    where,
    select: { id: true, nome: true, email: true, nivel: true, ativo: true, tenantId: true, createdAt: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(usuarios);
}

// POST – Criar utilizador (força o tenant do ADMIN)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const nivel = session.user.nivel;
  if (!["SUPER_ADMIN", "ADMIN"].includes(nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const { nome, email, senha, nivel: nivelAlvo } = await req.json();
  if (!nome || !email || !senha) {
    return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 });
  }

  // ADMIN força o seu tenantId; SUPER_ADMIN pode escolher (ou usar o seu)
  const tenantId = session.user.tenantId; // sempre o tenant do utilizador logado

  // Verificar se email já existe
  const existente = await prisma.usuario.findFirst({ where: { email } });
  if (existente) return NextResponse.json({ error: "Email já registado" }, { status: 400 });

  const hash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: hash,
      nivel: nivelAlvo || "GERENTE",
      tenantId,
      ativo: true,
    },
    select: { id: true, nome: true, email: true, nivel: true, ativo: true, tenantId: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}
