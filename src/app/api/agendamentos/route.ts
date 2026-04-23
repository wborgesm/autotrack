import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "agenda")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const tecnicoId = searchParams.get("tecnicoId");

  const where: any = { tenantId };
  if (inicio && fim) {
    where.dataHora = { gte: new Date(inicio), lte: new Date(fim) };
  }
  if (tecnicoId) where.tecnicoId = tecnicoId;

  const agendamentos = await prisma.agendamento.findMany({
    where,
    include: {
      cliente: { select: { nome: true, telefone: true } },
      veiculo: { select: { placa: true, modelo: true } },
      servico: { select: { nome: true } },
      tecnico: { select: { nome: true } },
    },
    orderBy: { dataHora: "asc" },
  });
  return NextResponse.json(agendamentos);
}

const schema = z.object({
  clienteId: z.string(),
  veiculoId: z.string(),
  servicoId: z.string().optional(),
  tecnicoId: z.string().optional(),
  dataHora: z.string().datetime(),
  duracao: z.number().int().default(60),
  observacoes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "agenda")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    const conflito = await prisma.agendamento.findFirst({
      where: {
        tenantId,
        tecnicoId: validated.tecnicoId,
        dataHora: new Date(validated.dataHora),
        status: { in: ["PENDENTE", "CONFIRMADO"] },
      },
    });
    if (conflito) {
      return NextResponse.json({ error: "Conflito de horário para o técnico" }, { status: 400 });
    }
    const agendamento = await prisma.agendamento.create({
      data: { tenantId, usuarioId: session.user.id, ...validated, dataHora: new Date(validated.dataHora) },
    });
    return NextResponse.json(agendamento, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
