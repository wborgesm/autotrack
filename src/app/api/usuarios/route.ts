import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";
import { NivelAcesso } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "usuarios")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const where: any = { tenantId, ativo: true };

  // SUPER_ADMIN vê todos; ADMIN vê todos exceto SUPER_ADMIN; outros veem apenas seu nível ou inferior
  if (session.user.nivel === "ADMIN") {
    where.nivel = { not: "SUPER_ADMIN" };
  } else if (!["SUPER_ADMIN"].includes(session.user.nivel)) {
    const niveisVisiveis: NivelAcesso[] = [];
    const ordem: NivelAcesso[] = ["SUPER_ADMIN", "ADMIN", "GERENTE", "TECNICO", "RECEPCIONISTA", "CLIENTE"];
    const idx = ordem.indexOf(session.user.nivel as NivelAcesso);
    for (let i = idx; i < ordem.length; i++) niveisVisiveis.push(ordem[i]);
    where.nivel = { in: niveisVisiveis };
  }

  const usuarios = await prisma.usuario.findMany({
    where,
    select: {
      id: true,
      nome: true,
      email: true,
      nivel: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(usuarios);
}

const createSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  nivel: z.nativeEnum(NivelAcesso), // aceita todos os níveis definidos no Prisma
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = createSchema.parse(body);

    // ADMIN não pode criar SUPER_ADMIN
    if (session.user.nivel === "ADMIN" && validated.nivel === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
    }

    const existe = await prisma.usuario.findFirst({
      where: { tenantId, email: validated.email },
    });
    if (existe) return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });

    // Limite de usuários por plano (exceto SUPER_ADMIN)
    if (session.user.nivel !== "SUPER_ADMIN") {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const qtd = await prisma.usuario.count({ where: { tenantId, ativo: true } });
      const limites: Record<string, number> = { STARTER: 3, PROFISSIONAL: 10, BUSINESS: 50, ENTERPRISE: 999 };
      if (qtd >= limites[tenant?.plano || "STARTER"]) {
        return NextResponse.json({ error: "Limite de usuários do plano atingido" }, { status: 400 });
      }
    }

    const senhaHash = await bcrypt.hash(validated.senha, 10);
    const usuario = await prisma.usuario.create({
      data: {
        tenantId,
        nome: validated.nome,
        email: validated.email,
        senha: senhaHash,
        nivel: validated.nivel,
      },
      select: { id: true, nome: true, email: true, nivel: true },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
