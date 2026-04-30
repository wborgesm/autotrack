import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const faturas = await prisma.fatura.findMany({
    where: { tenantId },
    include: {
      cliente: { select: { nome: true } },
      ordem: { select: { numero: true } },
      orcamento: { select: { numero: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(faturas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { ordemId, orcamentoId, tipo } = await req.json();
  if (!ordemId && !orcamentoId) return NextResponse.json({ error: "Associe a uma OS ou orçamento" }, { status: 400 });

  let origem;
  if (ordemId) {
    origem = await prisma.ordemServico.findFirst({ where: { id: ordemId, tenantId }, include: { cliente: true, veiculo: true } });
  } else {
    origem = await prisma.orcamento.findFirst({ where: { id: orcamentoId, tenantId }, include: { cliente: true, veiculo: true } });
  }
  if (!origem) return NextResponse.json({ error: "Documento de origem não encontrado" }, { status: 404 });

  const oficina = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!oficina) return NextResponse.json({ error: "Oficina não encontrada" }, { status: 404 });

  const ultima = await prisma.fatura.findFirst({ where: { tenantId }, orderBy: { createdAt: "desc" }, select: { numero: true } });
  const proximoNumero = ultima?.numero ? parseInt(ultima.numero.split("/").pop()!) + 1 : 1;
  const numero = `FA ${new Date().getFullYear()}/${proximoNumero.toString().padStart(3, "0")}`;

  const fatura = await prisma.fatura.create({
    data: {
      tenantId,
      numero,
      data: new Date(),
      clienteId: origem.clienteId!,
      ordemId: ordemId || null,
      orcamentoId: orcamentoId || null,
      total: origem.total,
      iva: 23,
      nifEmpresa: oficina.cnpj || "999999999",
      emitida: tipo === "moloni" ? false : true,
      pdfUrl: null,
    },
  });

  return NextResponse.json(fatura, { status: 201 });
}
