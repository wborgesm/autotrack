import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { status, dataHora, duracao, observacoes } = await req.json();
  
  const updated = await prisma.agendamento.updateMany({
    where: { id: params.id, tenantId },
    data: {
      ...(status && { status }),
      ...(dataHora && { dataHora: new Date(dataHora) }),
      ...(duracao && { duracao }),
      ...(observacoes !== undefined && { observacoes }),
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

  return NextResponse.json({ success: true });
}
