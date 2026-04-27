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
    include: {
      cliente: { select: { nome: true, telefone: true } },
      veiculo: { select: { placa: true, modelo: true } },
      tecnico: { select: { nome: true } },
      servico: { select: { nome: true } },
    },
    orderBy: { dataHora: "desc" },
  });

  const eventos = agendamentos.map(a => {
    const servicoNome = a.servico?.nome ? ` - ${a.servico.nome}` : "";
    return {
      id: a.id,
      title: `${a.cliente.nome}${servicoNome} - ${a.veiculo.placa}`,
      start: a.dataHora,
      end: new Date(new Date(a.dataHora).getTime() + (a.duracao || 60) * 60000),
      extendedProps: {
        cliente: a.cliente.nome,
        telefone: a.cliente.telefone,
        veiculo: `${a.veiculo.placa} ${a.veiculo.modelo}`,
        servico: a.servico?.nome || "Não definido",
        tecnico: a.tecnico?.nome,
        status: a.status,
        observacoes: a.observacoes,
        duracao: a.duracao,
      },
    };
  });

  return NextResponse.json(eventos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const mobileUser = !session ? getMobileUser(req) : null;
  if (!session && !mobileUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session?.user.tenantId || mobileUser?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { clienteId, veiculoId, servicoId, dataHora, observacoes, duracao } = await req.json();
  if (!clienteId || !veiculoId || !dataHora) {
    return NextResponse.json({ error: "Campos obrigatórios: clienteId, veiculoId, dataHora" }, { status: 400 });
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      tenantId,
      clienteId,
      veiculoId,
      servicoId: servicoId || null,
      dataHora: new Date(dataHora),
      duracao: duracao || 60,
      observacoes: observacoes || "",
      status: "PENDENTE",
    },
  });

  return NextResponse.json(agendamento, { status: 201 });
}
