import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const hoje = new Date();
  const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const vendas = await prisma.venda.findMany({
    where: { tenantId: session.user.tenantId, createdAt: { gte: inicioDoDia } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vendas);
}
