import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { searchParams } = req.nextUrl;
  const tecnicoId = searchParams.get("tecnicoId") || undefined;
  const usuarioId = searchParams.get("usuarioId") || undefined;
  const ordemId = searchParams.get("ordemId") || undefined;
  const hoje = new Date();
  const inicio = searchParams.get("inicio") || new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
  const fim = searchParams.get("fim") || new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).toISOString();

  const where: any = { tenantId, dataHora: { gte: new Date(inicio), lte: new Date(fim) } };
  if (tecnicoId) where.tecnicoId = tecnicoId;
  if (usuarioId) where.usuarioId = usuarioId;
  if (ordemId) where.ordemId = ordemId;

  const registos = await prisma.registroTempo.findMany({
    where,
    include: { tecnico: { select: { nome: true } }, ordem: { select: { numero: true, cliente: { select: { nome: true } } } } },
    orderBy: { dataHora: "desc" },
  });

  return NextResponse.json(registos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { tecnicoId, usuarioId, ordemId, tipo, observacao } = await req.json();
  if ((!tecnicoId && !usuarioId) || !tipo) return NextResponse.json({ error: "tecnicoId ou usuarioId e tipo são obrigatórios" }, { status: 400 });

  const registo = await prisma.registroTempo.create({
    data: { tenantId, tecnicoId: tecnicoId || null, usuarioId: usuarioId || null, ordemId: ordemId || null, tipo, dataHora: new Date(), observacao: observacao || "" },
  });

  return NextResponse.json(registo, { status: 201 });
}
