import { NivelAcesso } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  if (!checkApiPermissao(session.user.nivel, "veiculos")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const clienteId = searchParams.get("clienteId");
  const tipo = searchParams.get("tipo") as any;
  const q = searchParams.get("q") || "";

  const where: any = {
    tenantId,
    ativo: true,
  };

  if (clienteId) where.clienteId = clienteId;
  if (tipo) where.tipo = tipo;
  if (q) {
    where.OR = [
      { placa: { contains: q, mode: "insensitive" } },
      { marca: { contains: q, mode: "insensitive" } },
      { modelo: { contains: q, mode: "insensitive" } },
    ];
  }

  const veiculos = await prisma.veiculo.findMany({
    where,
    include: {
      cliente: { select: { nome: true } },
    },
    orderBy: { modelo: "asc" },
  });

  return NextResponse.json(veiculos);
}

const veiculoSchema = z.object({
  clienteId: z.string().min(1),
  tipo: z.enum(["CARRO", "MOTO", "UTILITARIO", "CAMINHAO"]),
  placa: z.string().min(1),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  ano: z.number().int().optional(),
  cor: z.string().optional(),
  combustivel: z.string().optional(),
  km: z.number().int().optional(),
  chassi: z.string().optional(),
  observacoes: z.string().optional(),
  imeiGps: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  if (!checkApiPermissao(session.user.nivel, "veiculos")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = veiculoSchema.parse(body);

    const placaNormalizada = validated.placa.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const existing = await prisma.veiculo.findFirst({
      where: { tenantId, placa: placaNormalizada },
    });
    if (existing) {
      return NextResponse.json({ error: "Placa já cadastrada" }, { status: 400 });
    }

    const veiculo = await prisma.veiculo.create({
      data: {
        tenantId,
        ...validated,
        placa: placaNormalizada,
      },
    });

    return NextResponse.json(veiculo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
