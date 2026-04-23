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
  if (!checkApiPermissao(session.user.nivel, "financeiro")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const mes = searchParams.get("mes");
  const tipo = searchParams.get("tipo") as "RECEITA" | "DESPESA" | null;

  const where: any = { tenantId };
  if (mes) {
    const [ano, mesNum] = mes.split("-").map(Number);
    const inicio = new Date(ano, mesNum - 1, 1);
    const fim = new Date(ano, mesNum, 0);
    where.data = { gte: inicio, lte: fim };
  }
  if (tipo) where.tipo = tipo;

  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where,
    include: { ordem: { select: { numero: true, cliente: { select: { nome: true } } } } },
    orderBy: { data: "desc" },
  });

  const hoje = new Date();
  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const [receita, despesa] = await Promise.all([
    prisma.lancamentoFinanceiro.aggregate({
      where: { tenantId, tipo: "RECEITA", data: { gte: inicioMesAtual, lte: fimMesAtual } },
      _sum: { valor: true },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      where: { tenantId, tipo: "DESPESA", data: { gte: inicioMesAtual, lte: fimMesAtual } },
      _sum: { valor: true },
    }),
  ]);

  const totalReceita = receita._sum.valor?.toNumber() || 0;
  const totalDespesa = despesa._sum.valor?.toNumber() || 0;
  const lucro = totalReceita - totalDespesa;
  const margem = totalReceita > 0 ? (lucro / totalReceita) * 100 : 0;

  const historico = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', data), 'YYYY-MM') as mes,
      SUM(CASE WHEN tipo = 'RECEITA' THEN valor ELSE 0 END) as receita,
      SUM(CASE WHEN tipo = 'DESPESA' THEN valor ELSE 0 END) as despesa
    FROM "lancamentos_financeiros"
    WHERE "tenantId" = ${tenantId}
      AND data >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', data)
    ORDER BY DATE_TRUNC('month', data) ASC
  `;

  return NextResponse.json({
    lancamentos,
    resumo: { totalReceita, totalDespesa, lucro, margem },
    historico,
  });
}

const schema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoria: z.string().optional(),
  descricao: z.string().min(1),
  valor: z.number().positive(),
  data: z.string().datetime().optional(),
  ordemId: z.string().optional(),
  pago: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["ADMIN", "SUPER_ADMIN", "GERENTE"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }
  try {
    const body = await req.json();
    // Garantir que valor é número
    if (typeof body.valor === "string") body.valor = parseFloat(body.valor);
    const validated = schema.parse(body);
    const lancamento = await prisma.lancamentoFinanceiro.create({
      data: {
        tenantId,
        ...validated,
        data: validated.data ? new Date(validated.data) : new Date(),
      },
    });
    return NextResponse.json(lancamento, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
