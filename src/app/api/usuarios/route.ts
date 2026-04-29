import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { podeAtribuirNivel, recursosExtrasDisponiveis, Recurso } from "@/lib/permissoes";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const criadorNivel = session.user.nivel as any;

  try {
    const body = await request.json();
    const { nome, email, senha, nivel, permissoesExtras } = body;

    // 1. Validar nível permitido
    if (!nivel || (criadorNivel !== "SUPER_ADMIN" && !podeAtribuirNivel(criadorNivel, nivel))) {
      return NextResponse.json({ error: "Não tens permissão para atribuir esse nível." }, { status: 403 });
    }

    // 2. Validar permissões extra (apenas as disponíveis para o nível)
    const extrasValidos = recursosExtrasDisponiveis(nivel);
    const extrasFiltrados = (permissoesExtras || []).filter((r: string) => extrasValidos.includes(r as Recurso));

    // 3. Criar utilizador
    const usuario = await prisma.usuario.create({
      data: {
        tenantId: session.user.tenantId,
        nome,
        email,
        senha,
        nivel,
        permissoesExtras: extrasFiltrados,
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
    const { id, nivel, permissoesExtras } = body;

    // Se o nível for alterado, validar
    if (nivel) {
      if (!podeAtribuirNivel(criadorNivel, nivel)) {
        return NextResponse.json({ error: "Não tens permissão para atribuir esse nível." }, { status: 403 });
      }
    }

    const extrasValidos = recursosExtrasDisponiveis(nivel);
    const extrasFiltrados = (permissoesExtras || []).filter((r: string) => extrasValidos.includes(r as Recurso));

    const usuario = await prisma.usuario.update({
      where: { id, tenantId: session.user.tenantId },
      data: {
        nivel,
        permissoesExtras: extrasFiltrados,
      },
    });

    return NextResponse.json({ usuario });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar utilizador." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const usuarios = await prisma.usuario.findMany({
    where: { tenantId: session.user.tenantId },
    select: {
      id: true,
      nome: true,
      email: true,
      nivel: true,
      ativo: true,
      createdAt: true,
      permissoesExtras: true,
      avatar: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(usuarios);
}
