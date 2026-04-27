import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json([]);

  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 1) return NextResponse.json([]);

  const results: any[] = [];

  const [clientes, veiculos, ordens, orcamentos, alugueres] = await Promise.all([
    prisma.cliente.findMany({ where: { tenantId, nome: { contains: q, mode: "insensitive" } }, select: { id: true, nome: true }, take: 3 }),
    prisma.veiculo.findMany({ where: { tenantId, placa: { contains: q, mode: "insensitive" } }, select: { id: true, placa: true, modelo: true }, take: 3 }),
    prisma.ordemServico.findMany({ where: { tenantId, OR: [{ numero: { equals: isNaN(Number(q)) ? undefined : Number(q) } }, { cliente: { nome: { contains: q, mode: "insensitive" } } }] }, select: { id: true, numero: true, cliente: { select: { nome: true } } }, take: 3 }),
    prisma.orcamento.findMany({ where: { tenantId, OR: [{ numero: { equals: isNaN(Number(q)) ? undefined : Number(q) } }, { cliente: { nome: { contains: q, mode: "insensitive" } } }] }, select: { id: true, numero: true, cliente: { select: { nome: true } } }, take: 3 }),
    prisma.aluguer.findMany({ where: { tenantId, cliente: { nome: { contains: q, mode: "insensitive" } } }, select: { id: true, dataInicio: true, cliente: { select: { nome: true } }, veiculo: { select: { placa: true } } }, take: 3 }),
  ]);

  clientes.forEach(c => results.push({ type: "cliente", id: c.id, title: c.nome }));
  veiculos.forEach(v => results.push({ type: "veiculo", id: v.id, title: v.placa, subtitle: v.modelo }));
  ordens.forEach(o => results.push({ type: "ordem", id: o.id, title: `OS #${o.numero}`, subtitle: o.cliente?.nome }));
  orcamentos.forEach(o => results.push({ type: "orcamento", id: o.id, title: `Orçamento #${o.numero}`, subtitle: o.cliente?.nome }));
  alugueres.forEach(a => results.push({ type: "aluguer", id: a.id, title: a.cliente?.nome || "Aluguer", subtitle: a.veiculo?.placa }));

  return NextResponse.json(results.slice(0, 10));
}
