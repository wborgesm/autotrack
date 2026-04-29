import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { podeAtribuirNivel } from "@/lib/permissoes";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const usuarios = await prisma.usuario.findMany({
    where: { tenantId: session.user.tenantId },
    select: {
      id: true, nome: true, email: true, nivel: true, ativo: true,
      createdAt: true, permissoes: true, avatar: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const criadorNivel = session.user.nivel as any;

  try {
    const body = await request.json();
    const { nome, email, senha, nivel, permissoes } = body;

    if (!nivel || (criadorNivel !== "SUPER_ADMIN" && !podeAtribuirNivel(criadorNivel, nivel))) {
      return NextResponse.json({ error: "Não tens permissão para atribuir esse nível." }, { status: 403 });
    }

    const hash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        tenantId: session.user.tenantId,
        nome,
        email,
        senha: hash,
        nivel,
        permissoes: permissoes || [],
      },
    });

    return NextResponse.json({ usuario }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Já existe um utilizador com esse email." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar utilizador." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const criadorNivel = session.user.nivel as any;

  try {
    const body = await request.json();
    const { id, nivel, permissoes } = body;

    if (nivel && criadorNivel !== "SUPER_ADMIN" && !podeAtribuirNivel(criadorNivel, nivel)) {
      return NextResponse.json({ error: "Não tens permissão para atribuir esse nível." }, { status: 403 });
    }

    const usuario = await prisma.usuario.update({
      where: { id, tenantId: session.user.tenantId },
      data: { nivel, permissoes },
    });

    return NextResponse.json({ usuario });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar utilizador." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const criadorNivel = session.user.nivel as any;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const alvo = await prisma.usuario.findUnique({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!alvo) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  if (criadorNivel !== "SUPER_ADMIN" && !podeAtribuirNivel(criadorNivel, alvo.nivel)) {
    return NextResponse.json({ error: "Sem permissão para apagar este utilizador" }, { status: 403 });
  }

  await prisma.usuario.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
