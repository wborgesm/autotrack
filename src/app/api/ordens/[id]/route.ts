import { adicionarFila } from "@/lib/notificacoes/fila";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao, podeGerenciarOrdem } from "@/lib/permissoes";
import { creditarPontos } from "@/lib/pontos";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  if (!checkApiPermissao(session.user.nivel, "ordens")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const ordem = await prisma.ordemServico.findFirst({
    where: { id: params.id, tenantId },
    include: {
      cliente: true,
      veiculo: true,
      tecnico: true,
      itens: { include: { servico: true } },
      itensPeca: { include: { peca: true } },
      historico: { orderBy: { createdAt: "desc" } },
      lancamentos: true,
    },
  });

  if (!ordem) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
  }

  if (!podeGerenciarOrdem(session.user.nivel, session.user.id, ordem.tecnicoId, ordem.usuarioId)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  return NextResponse.json(ordem);
}

const patchSchema = z.object({
  status: z.enum(["ABERTA", "EM_DIAGNOSTICO", "AGUARDANDO_PECAS", "EM_SERVICO", "TESTE_FINAL", "PRONTA", "ENTREGUE", "CANCELADA"]).optional(),
  laudoTecnico: z.string().optional(),
  observacoes: z.string().optional(),
  tecnicoId: z.string().optional(),
  kmSaida: z.number().int().optional(),
  dataEntrega: z.string().datetime().optional(),
  totalMaoObra: z.number().optional(),
  totalPecas: z.number().optional(),
  desconto: z.number().optional(),
  total: z.number().optional(),
  pago: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  if (!checkApiPermissao(session.user.nivel, "ordens")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const ordemAtual = await prisma.ordemServico.findFirst({
    where: { id: params.id, tenantId },
    include: { tenant: true, veiculo: true, cliente: true },
  });

  if (!ordemAtual) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
  }

  if (!podeGerenciarOrdem(session.user.nivel, session.user.id, ordemAtual.tecnicoId, ordemAtual.usuarioId)) {
    return NextResponse.json({ error: "Permissão negada para editar esta OS" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = patchSchema.parse(body);

    const statusAnterior = ordemAtual.status;
    const novoStatus = validated.status;

    const deveCreditarPontos = novoStatus === "ENTREGUE" && statusAnterior !== "ENTREGUE";

    const ordem = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.ordemServico.update({
        where: { id: params.id },
        data: {
          ...validated,
          dataEntrega: validated.dataEntrega ? new Date(validated.dataEntrega) : undefined,
        },
      });

      if (novoStatus && novoStatus !== statusAnterior) {
        await tx.historicoOrdem.create({
          data: {
            ordemId: params.id,
            status: novoStatus,
            usuarioNome: session.user.name || session.user.email,
            observacao: validated.observacoes || `Status alterado de ${statusAnterior} para ${novoStatus}`,
          },
        });
      }

      return updated;
    });

    // Crédito de pontos (se aplicável)
    if (deveCreditarPontos && ordemAtual.tenant.addonPontos) {
      try {
        await creditarPontos({
          tenant: ordemAtual.tenant,
          clienteId: ordemAtual.clienteId,
          valorTotal: ordem.total.toNumber(),
          tipoVeiculo: ordemAtual.veiculo.tipo,
          ordemId: ordem.id,
        });
      } catch (error) {
        console.error("Erro ao creditar pontos:", error);
      }
    }

    // Notificações (sms + whatsapp) via fila
    if (novoStatus && (novoStatus === "PRONTA" || novoStatus === "ENTREGUE") && ordemAtual.cliente?.telefone) {
      const mensagem = `Olá ${ordemAtual.cliente.nome}, a sua OS #${ordem.numero} foi atualizada para ${novoStatus}.`;
      adicionarFila("whatsapp", ordemAtual.cliente.telefone, mensagem);
      adicionarFila("sms", ordemAtual.cliente.telefone, mensagem);
    }

    return NextResponse.json(ordem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  if (!checkApiPermissao(session.user.nivel, "ordens")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const ordemAtual = await prisma.ordemServico.findFirst({
    where: { id: params.id, tenantId },
  });

  if (!ordemAtual) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
  }

  if (!podeGerenciarOrdem(session.user.nivel, session.user.id, ordemAtual.tecnicoId, ordemAtual.usuarioId)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const ordem = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.ordemServico.update({
      where: { id: params.id },
      data: { status: "CANCELADA" },
    });

    await tx.historicoOrdem.create({
      data: {
        ordemId: params.id,
        status: "CANCELADA",
        usuarioNome: session.user.name || session.user.email,
        observacao: "Ordem cancelada pelo usuário",
      },
    });

    return updated;
  });

  return NextResponse.json(ordem);
}
