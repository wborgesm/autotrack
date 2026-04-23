import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resgatarPontos } from "@/lib/pontos";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });

  if (!tenant || !tenant.addonPontos) {
    return NextResponse.json({ error: "Addon Pontos não ativo" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action") || "ranking";
  const clienteId = searchParams.get("clienteId");

  try {
    if (action === "ranking") {
      const ranking = await prisma.pontosFidelidade.findMany({
        include: {
          cliente: { select: { nome: true, telefone: true } },
          transacoes: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { pontos: "desc" },
        take: 50,
      });
      return NextResponse.json(ranking);
    }

    if (action === "stats") {
      const stats = await prisma.$transaction([
        prisma.pontosFidelidade.aggregate({ _sum: { pontos: true } }),
        prisma.pontosFidelidade.count(),
        prisma.transacaoPontos.count({ where: { tipo: "DEBITO" } }),
      ]);
      return NextResponse.json({
        totalPontos: stats[0]._sum.pontos || 0,
        totalClientes: stats[1],
        totalResgates: stats[2],
      });
    }

    if (clienteId) {
      const fidelidade = await prisma.pontosFidelidade.findUnique({
        where: { clienteId },
        include: {
          cliente: { select: { nome: true } },
          transacoes: { orderBy: { createdAt: "desc" } },
        },
      });
      return NextResponse.json(fidelidade || { pontos: 0, nivel: "BRONZE" });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

const resgatarSchema = z.object({
  action: z.literal("resgatar"),
  clienteId: z.string(),
  quantidade: z.number().int().positive(),
  descricao: z.string().optional(),
});

const manualSchema = z.object({
  action: z.literal("manual"),
  clienteId: z.string(),
  quantidade: z.number().int(),
  descricao: z.string(),
});

const configSchema = z.object({
  action: z.literal("config"),
  pontosPorReal: z.number().int().min(1),
  bonusMoto: z.number().int().min(0).max(100),
  minimoResgate: z.number().int().min(1),
  validadeMeses: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });

  if (!tenant || !tenant.addonPontos) {
    return NextResponse.json({ error: "Addon Pontos não ativo" }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (body.action === "resgatar") {
      const validated = resgatarSchema.parse(body);
      const result = await resgatarPontos({
        tenant,
        clienteId: validated.clienteId,
        quantidade: validated.quantidade,
        descricao: validated.descricao,
      });
      return NextResponse.json(result);
    }

    if (body.action === "manual") {
      const validated = manualSchema.parse(body);
      if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.nivel)) {
        return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
      }

      let fidelidade = await prisma.pontosFidelidade.findUnique({
        where: { clienteId: validated.clienteId },
      });
      if (!fidelidade) {
        fidelidade = await prisma.pontosFidelidade.create({
          data: { clienteId: validated.clienteId, pontos: 0 },
        });
      }

      const novoTotal = fidelidade.pontos + validated.quantidade;
      let nivel = fidelidade.nivel;
      if (novoTotal >= 10001) nivel = "PLATINA";
      else if (novoTotal >= 3001) nivel = "OURO";
      else if (novoTotal >= 1001) nivel = "PRATA";
      else nivel = "BRONZE";

      await prisma.$transaction([
        prisma.pontosFidelidade.update({
          where: { clienteId: validated.clienteId },
          data: { pontos: novoTotal, nivel },
        }),
        prisma.transacaoPontos.create({
          data: {
            pontosId: fidelidade.id,
            tipo: validated.quantidade > 0 ? "CREDITO" : "DEBITO",
            quantidade: Math.abs(validated.quantidade),
            descricao: validated.descricao,
          },
        }),
      ]);

      return NextResponse.json({ saldoAtual: novoTotal });
    }

    if (body.action === "config") {
      if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.nivel)) {
        return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
      }
      const validated = configSchema.parse(body);
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          pontosPorReal: validated.pontosPorReal,
          bonusMoto: validated.bonusMoto,
          minimoResgate: validated.minimoResgate,
          validadeMeses: validated.validadeMeses,
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
