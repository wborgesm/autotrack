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
  if (!checkApiPermissao(session.user.nivel, "ordens")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") as any;
  const where: any = { tenantId };
  if (status) where.status = status;
  if (session.user.nivel === "TECNICO") where.tecnicoId = session.user.id;
  const [ordens, total] = await Promise.all([
    prisma.ordemServico.findMany({ where, include: { cliente: true, veiculo: true, tecnico: true }, skip: (page-1)*limit, take: limit, orderBy: { dataEntrada: "desc" } }),
    prisma.ordemServico.count({ where }),
  ]);
  return NextResponse.json({ data: ordens, total, page, limit, totalPages: Math.ceil(total/limit) });
}

const ordemCreateSchema = z.object({
  clienteId: z.string().min(1),
  veiculoId: z.string().min(1),
  tecnicoId: z.string().optional(),
  kmEntrada: z.number().int().optional(),
  relatoCliente: z.string().optional(),
  dataPrevista: z.string().datetime().optional(),
  observacoes: z.string().optional(),
  agendamentoId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "ordens")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const validated = ordemCreateSchema.parse(body);
    const ordem = await prisma.$transaction(async (tx) => {
      const ultimo = await tx.ordemServico.findFirst({ where: { tenantId }, orderBy: { numero: "desc" }, select: { numero: true } });
      const proximoNumero = (ultimo?.numero || 0) + 1;
      return tx.ordemServico.create({
        data: {
          tenantId,
          numero: proximoNumero,
          clienteId: validated.clienteId,
          veiculoId: validated.veiculoId,
          tecnicoId: validated.tecnicoId,
          usuarioId: session.user.id,
          kmEntrada: validated.kmEntrada,
          relatoCliente: validated.relatoCliente,
          dataPrevista: validated.dataPrevista ? new Date(validated.dataPrevista) : undefined,
          observacoes: validated.observacoes,
          agendamentoId: validated.agendamentoId,
          status: "ABERTA",
        },
        include: { cliente: true, veiculo: true },
      });
    });
    if (validated.agendamentoId) {
      await prisma.agendamento.update({ where: { id: validated.agendamentoId }, data: { status: "CONFIRMADO" } });
    }
    await prisma.historicoOrdem.create({ data: { ordemId: ordem.id, status: "ABERTA", usuarioNome: session.user.name || session.user.email, observacao: "Ordem criada" } });
    return NextResponse.json(ordem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
