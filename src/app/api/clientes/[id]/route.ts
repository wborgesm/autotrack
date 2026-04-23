import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  if (!checkApiPermissao(session.user.nivel, "clientes")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id: params.id, tenantId },
    include: {
      veiculos: { where: { ativo: true } },
      ordens: { orderBy: { dataEntrada: "desc" }, take: 10 },
      pontosFidelidade: true,
      _count: { select: { veiculos: true, ordens: true } },
    },
  });

  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(cliente);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  if (!checkApiPermissao(session.user.nivel, "clientes")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nome, cpf, telefone, email, endereco, observacoes, ativo } = body;

    const cliente = await prisma.cliente.updateMany({
      where: { id: params.id, tenantId },
      data: { nome, cpf, telefone, email, endereco, observacoes, ativo },
    });

    if (cliente.count === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const updated = await prisma.cliente.findUnique({
      where: { id: params.id },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  if (!checkApiPermissao(session.user.nivel, "clientes")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  await prisma.cliente.updateMany({
    where: { id: params.id, tenantId },
    data: { ativo: false },
  });

  return NextResponse.json({ success: true });
}
