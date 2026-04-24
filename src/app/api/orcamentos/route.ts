import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { checkApiPermissao } from "@/lib/permissoes";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "orcamentos")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const clienteId = searchParams.get("clienteId") || undefined;
  const status = searchParams.get("status") || undefined;

  const where: any = { tenantId };
  if (clienteId) where.clienteId = clienteId;
  if (status) where.status = status;

  const orcamentos = await prisma.orcamento.findMany({
    where,
    include: {
      cliente: { select: { id: true, nome: true, telefone: true } },
      veiculo: { select: { id: true, matricula: true, placa: true, marca: true, modelo: true } },
      itens: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: orcamentos });
}

const itemSchema = z.object({
  tipo: z.enum(["SERVICO", "PECA"]),
  servicoId: z.string().nullable().optional(),
  pecaId: z.string().nullable().optional(),
  quantidade: z.number().positive().default(1),
  valorUnit: z.number().nonnegative(),
  desconto: z.number().nonnegative().default(0),
});

const orcamentoSchema = z.object({
  clienteId: z.string().optional(),
  veiculoId: z.string().optional(),
  descricao: z.string().optional(),
  status: z.enum(["PENDENTE", "APROVADO", "RECUSADO", "CONVERTIDO"]).default("PENDENTE"),
  itens: z.array(itemSchema).min(1),
  total: z.number().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["SUPER_ADMIN", "ADMIN", "GERENTE", "RECEPCIONISTA"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (body.clienteId === "" || body.clienteId === " ") body.clienteId = undefined;
    if (body.veiculoId === "" || body.veiculoId === " ") body.veiculoId = undefined;

    const validated = orcamentoSchema.parse(body);

    const ultimo = await prisma.orcamento.findFirst({
      where: { tenantId },
      orderBy: { numero: "desc" },
      select: { numero: true },
    });
    const proximoNumero = (ultimo?.numero ?? 0) + 1;

    const total = validated.total ?? validated.itens.reduce((sum, item) => sum + item.quantidade * item.valorUnit - item.desconto, 0);

    const orcamento = await prisma.orcamento.create({
      data: {
        tenantId,
        numero: proximoNumero,
        clienteId: validated.clienteId || undefined,
        veiculoId: validated.veiculoId || undefined,
        descricao: validated.descricao,
        status: validated.status,
        total,
        itens: {
          create: validated.itens.map((item: any) => ({
            tipo: item.tipo,
            servicoId: item.servicoId || null,
            pecaId: item.pecaId || null,
            quantidade: item.quantidade,
            valorUnit: item.valorUnit,
            desconto: item.desconto,
            total: item.quantidade * item.valorUnit - item.desconto,
          })),
        },
      } as any,
      include: {
        cliente: { select: { id: true, nome: true } },
        itens: true,
      },
    });

    if (session.user.nivel === "ADMIN" || session.user.nivel === "SUPER_ADMIN") {
      await registrarAuditoria({
        tenantId,
        usuarioId: session.user.id,
        usuarioNome: session.user.name || session.user.email!,
        acao: "Criação de orçamento",
        entidade: "Orcamento",
        entidadeId: orcamento.id,
        dadosNovos: validated,
      });
    }

    return NextResponse.json(orcamento, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
