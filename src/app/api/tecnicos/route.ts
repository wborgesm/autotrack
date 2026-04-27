import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const tecnicos = await prisma.tecnico.findMany({
    where: { tenantId, ativo: true },
    select: { id: true, nome: true, especialidade: true, telefone: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(tecnicos);
}
