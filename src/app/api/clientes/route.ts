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

  if (!checkApiPermissao(session.user.nivel, "clientes")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const q = searchParams.get("q") || "";

  const where: any = {
    tenantId,
    ativo: true,
  };

  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { cpf: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { telefone: { contains: q, mode: "insensitive" } },
    ];
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: {
        _count: { select: { veiculos: true, ordens: true } },
        pontosFidelidade: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nome: "asc" },
    }),
    prisma.cliente.count({ where }),
  ]);

  return NextResponse.json({
    data: clientes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

const clienteSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
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

  if (!checkApiPermissao(session.user.nivel, "clientes")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = clienteSchema.parse(body);

    if (validated.cpf) {
      const existing = await prisma.cliente.findFirst({
        where: { tenantId, cpf: validated.cpf },
      });
      if (existing) {
        return NextResponse.json({ error: "CPF já cadastrado" }, { status: 400 });
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        tenantId,
        ...validated,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
