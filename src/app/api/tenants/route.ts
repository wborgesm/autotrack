import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET – Listar todos os Tenants com contagem de utilizadores
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
  }

  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { usuarios: true, clientes: true, ordensServico: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(tenants);
}

// POST – Criar Tenant + ADMIN associado
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
  }

  const { nomeEmpresa, emailAdmin, nomeAdmin, senhaAdmin, plano } = await req.json();
  if (!nomeEmpresa || !emailAdmin || !senhaAdmin) {
    return NextResponse.json({ error: "Campos obrigatórios: nomeEmpresa, emailAdmin, senhaAdmin" }, { status: 400 });
  }

  // Verificar se o email já existe
  const existente = await prisma.usuario.findFirst({ where: { email: emailAdmin } });
  if (existente) {
    return NextResponse.json({ error: "Este email já está registado" }, { status: 400 });
  }

  // Criar Tenant e Admin numa transação
  const tenant = await prisma.tenant.create({
    data: {
      nome: nomeEmpresa,
      plano: plano || "STARTER",
      ativo: true,
    },
  });

  const hash = await bcrypt.hash(senhaAdmin, 10);
  const admin = await prisma.usuario.create({
    data: {
      email: emailAdmin,
      nome: nomeAdmin || `Admin de ${nomeEmpresa}`,
      senha: hash,
      nivel: "ADMIN",
      tenantId: tenant.id,
      ativo: true,
    },
  });

  return NextResponse.json({ tenant, admin }, { status: 201 });
}
