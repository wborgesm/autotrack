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
  const status = searchParams.get("status") || undefined;
  const where: any = { tenantId };
  if (status) where.status = status;

  const alugueres = await prisma.aluguer.findMany({
    where,
    include: {
      cliente: { select: { nome: true, telefone: true } },
      veiculo: { select: { placa: true, modelo: true, marca: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alugueres);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { clienteId, veiculoId, dataInicio, dataFim, valorDiaria, observacoes } = await req.json();
  if (!clienteId || !veiculoId || !dataInicio || !valorDiaria) {
    return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const aluguer = await prisma.aluguer.create({
    data: {
      tenantId,
      clienteId,
      veiculoId,
      dataInicio: new Date(dataInicio),
      dataFim: dataFim ? new Date(dataFim) : null,
      valorDiaria,
      observacoes,
    },
  });

  return NextResponse.json(aluguer, { status: 201 });
}
