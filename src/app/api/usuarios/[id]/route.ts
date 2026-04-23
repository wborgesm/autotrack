import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const body = await req.json();
  const { nome, email, senha, nivel, ativo } = body;

  const updateData: any = {};
  if (nome) updateData.nome = nome;
  if (email) updateData.email = email;
  if (nivel) updateData.nivel = nivel;
  if (ativo !== undefined) updateData.ativo = ativo;
  if (senha) updateData.senha = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.updateMany({
    where: { id: params.id, tenantId },
    data: updateData,
  });

  if (usuario.count === 0) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const updated = await prisma.usuario.findUnique({
    where: { id: params.id },
    select: { id: true, nome: true, email: true, nivel: true, ativo: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Não pode excluir a si próprio" }, { status: 400 });
  }

  await prisma.usuario.updateMany({
    where: { id: params.id, tenantId },
    data: { ativo: false },
  });
  return NextResponse.json({ success: true });
}
