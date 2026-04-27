import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: params.id, tenantId },
    include: {
      cliente: { select: { id: true, nome: true } },
      veiculo: { select: { id: true, placa: true, matricula: true, marca: true, modelo: true } },
      itens: {
        include: {
          servico: { select: { nome: true } },
          peca: { select: { nome: true } },
        },
      },
    },
  });

  if (!orcamento) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  return NextResponse.json(orcamento);
}
