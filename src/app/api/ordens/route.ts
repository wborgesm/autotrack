import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/auth-mobile";
import { NivelAcesso } from "@prisma/client";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const mobileUser = !session ? getMobileUser(req) : null;
  if (!session && !mobileUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tenantId = session?.user.tenantId || mobileUser?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || undefined;
  const clienteId = searchParams.get("clienteId") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = { tenantId };
  if (status) where.status = status;
  if (clienteId) where.clienteId = clienteId;

  const ordens = await prisma.ordemServico.findMany({
    where, include: { cliente: { select: { nome: true } }, veiculo: { select: { placa: true, modelo: true } } },
    orderBy: { createdAt: "desc" }, take: limit,
  });

  return NextResponse.json(ordens);
}

const ordemSchema = z.object({
  clienteId: z.string(), veiculoId: z.string(),
  status: z.enum(["ABERTA","EM_DIAGNOSTICO","AGUARDANDO_PECAS","EM_SERVICO","TESTE_FINAL","PRONTA","ENTREGUE","CANCELADA"]).default("ABERTA"),
  observacoes: z.string().optional(),
  itens: z.array(z.object({ servicoId: z.string(), quantidade: z.number().positive(), valorUnit: z.number().nonnegative(), desconto: z.number().default(0) })).optional(),
  itensPeca: z.array(z.object({ pecaId: z.string(), quantidade: z.number().positive(), valorUnit: z.number().nonnegative(), desconto: z.number().default(0) })).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const mobileUser = !session ? getMobileUser(req) : null;
  if (!session && !mobileUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tenantId = session?.user.tenantId || mobileUser?.tenantId;
  const nivel = (session?.user.nivel || mobileUser?.nivel || "CLIENTE") as NivelAcesso;
  if (!tenantId || !["SUPER_ADMIN","ADMIN","GERENTE","RECEPCIONISTA"].includes(nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = ordemSchema.parse(body);
    const ultimo = await prisma.ordemServico.findFirst({ where: { tenantId }, orderBy: { numero: "desc" }, select: { numero: true } });
    const proximoNumero = (ultimo?.numero ?? 0) + 1;

    const ordem = await prisma.ordemServico.create({
      data: {
        tenantId, numero: proximoNumero,
        clienteId: validated.clienteId, veiculoId: validated.veiculoId,
        status: validated.status, observacoes: validated.observacoes,
        itens: validated.itens ? { create: validated.itens.map(item => ({
          servicoId: item.servicoId, quantidade: item.quantidade, valorUnit: item.valorUnit, desconto: item.desconto,
          total: item.quantidade * item.valorUnit - item.desconto,
        })) } : undefined,
        itensPeca: validated.itensPeca ? { create: validated.itensPeca.map(item => ({
          pecaId: item.pecaId, quantidade: item.quantidade, valorUnit: item.valorUnit, desconto: item.desconto,
          total: item.quantidade * item.valorUnit - item.desconto,
        })) } : undefined,
      },
      include: { cliente: { select: { nome: true } }, veiculo: { select: { placa: true } } },
    });

    return NextResponse.json({ id: ordem.id, numero: ordem.numero }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
