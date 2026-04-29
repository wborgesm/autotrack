import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { caixaId } = await req.json();

  await prisma.caixa.update({
    where: { id: caixaId },
    data: { fechamento: new Date() },
  });

  return NextResponse.json({ success: true });
}
