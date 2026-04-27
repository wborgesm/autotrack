import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMoloniConfiguredForTenant, findOrCreateCustomer, createSimplifiedInvoice } from "@/lib/moloni";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.nivel)) return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { ordemId } = await req.json();
  if (!ordemId) return NextResponse.json({ error: "ID da ordem é obrigatório" }, { status: 400 });

  const configOk = await isMoloniConfiguredForTenant(tenantId);
  if (!configOk) return NextResponse.json({ error: "Moloni não configurado para esta empresa" }, { status: 400 });

  try {
    const ordem = await prisma.ordemServico.findFirst({
      where: { id: ordemId, tenantId },
      include: { cliente: true, itens: { include: { servico: true } }, itensPeca: { include: { peca: true } } },
    });
    if (!ordem) return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
    if (!ordem.cliente) return NextResponse.json({ error: "Ordem sem cliente associado" }, { status: 400 });

    const customerId = await findOrCreateCustomer(tenantId, ordem.cliente.nome, ordem.cliente.cpf || undefined, ordem.cliente.email || undefined, ordem.cliente.telefone || undefined, ordem.cliente.endereco || undefined);

    const products: any[] = [];
    for (const item of ordem.itens) {
      products.push({ name: item.servico.nome, summary: `Serviço - OS #${ordem.numero}`, qty: item.quantidade, price: Number(item.valorUnit), taxes: [{ tax_id: 1, order: 0 }], discount: Number(item.desconto) || 0 });
    }
    for (const item of ordem.itensPeca) {
      products.push({ name: item.peca.nome, summary: `Peça - OS #${ordem.numero}`, qty: Number(item.quantidade), price: Number(item.valorUnit), taxes: [{ tax_id: 1, order: 0 }], discount: Number(item.desconto) || 0 });
    }
    if (products.length === 0) return NextResponse.json({ error: "Ordem sem itens para faturar" }, { status: 400 });

    const resultado = await createSimplifiedInvoice(tenantId, customerId, products, { ourReference: `OS #${ordem.numero}`, notes: `Fatura referente à Ordem de Serviço #${ordem.numero}`, status: 1, date: new Date().toISOString().slice(0, 10) });

    await prisma.ordemServico.update({ where: { id: ordemId }, data: { estadoFiscal: "EMITIDO", numFatura: resultado.number } });

    return NextResponse.json({ success: true, numeroFatura: resultado.number, documentId: resultado.document_id, mensagem: `Fatura ${resultado.number} emitida com sucesso.` });
  } catch (error: any) {
    console.error("Erro ao emitir fatura:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
