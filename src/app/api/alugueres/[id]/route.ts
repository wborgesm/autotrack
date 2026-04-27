import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  const { status, dataFim } = await req.json();
  const data: any = {};
  if (status) data.status = status;
  if (dataFim) data.dataFim = new Date(dataFim);
  if (status === "FINALIZADO") { const aluguer = await prisma.aluguer.findFirst({ where: { id: params.id, tenantId } }); if (aluguer && aluguer.dataInicio) { const fim = dataFim ? new Date(dataFim) : new Date(); data.valorTotal = Number(aluguer.valorDiaria) * Math.max(1, Math.ceil((fim.getTime() - new Date(aluguer.dataInicio).getTime()) / (1000 * 60 * 60 * 24))); } }
  const updated = await prisma.aluguer.updateMany({ where: { id: params.id, tenantId }, data });
  if (updated.count === 0) return NextResponse.json({ error: "Aluguer não encontrado" }, { status: 404 });
  return NextResponse.json({ success: true });
}
