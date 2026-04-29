import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: any = { tenantId: session.user.tenantId };
  if (status && status !== "todas") where.status = status;

  const encomendas = await prisma.encomenda.findMany({
    where,
    include: {
      cliente: { select: { nome: true } },
      veiculo: { select: { placa: true, marca: true, modelo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ encomendas });
}
