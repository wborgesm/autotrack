import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { nome, avatar } = await req.json();
  const data: any = {};
  if (nome !== undefined) data.nome = nome;
  if (avatar !== undefined) data.avatar = avatar;

  await prisma.usuario.update({ where: { id: session.user.id }, data });

  return NextResponse.json({ success: true });
}
