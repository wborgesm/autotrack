import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "ordens")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }
  const tecnicos = await prisma.tecnico.findMany({
    where: { tenantId, ativo: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(tecnicos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["ADMIN", "SUPER_ADMIN", "GERENTE"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }
  const body = await req.json();
  const tecnico = await prisma.tecnico.create({ data: { tenantId, ...body } });
  return NextResponse.json(tecnico, { status: 201 });
}
