import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/auth-mobile";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const mobileUser = !session ? getMobileUser(req) : null;
  if (!session && !mobileUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session?.user.tenantId || mobileUser?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const agendamentos = await prisma.agendamento.findMany({
    where: { tenantId },
    include: { cliente: { select: { nome: true } }, veiculo: { select: { placa: true, modelo: true } }, tecnico: { select: { nome: true } } },
  });

  const eventos = agendamentos.map(a => ({
    id: a.id,
    title: `${a.cliente.nome} - ${a.veiculo.placa}`,
    start: a.dataHora,
    end: new Date(new Date(a.dataHora).getTime() + (a.duracao || 60) * 60000),
    extendedProps: { tecnico: a.tecnico?.nome, servico: a.servicoId, status: a.status },
  }));

  return NextResponse.json(eventos);
}
