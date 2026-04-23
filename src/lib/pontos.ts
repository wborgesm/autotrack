import { prisma } from "./prisma";
import { Tenant, TipoVeiculo } from "@prisma/client";

interface CreditPontosParams {
  tenant: Tenant;
  clienteId: string;
  valorTotal: number;
  tipoVeiculo: TipoVeiculo;
  ordemId: string;
}

export async function creditarPontos({
  tenant,
  clienteId,
  valorTotal,
  tipoVeiculo,
  ordemId,
}: CreditPontosParams) {
  if (!tenant.addonPontos) return;

  let pontos = Math.floor((valorTotal * tenant.pontosPorReal) / 100);

  if (tipoVeiculo === "MOTO") {
    const bonus = Math.floor((pontos * tenant.bonusMoto) / 100);
    pontos += bonus;
  }

  if (pontos <= 0) return;

  let fidelidade = await prisma.pontosFidelidade.findUnique({
    where: { clienteId },
  });

  if (!fidelidade) {
    fidelidade = await prisma.pontosFidelidade.create({
      data: { clienteId, pontos: 0 },
    });
  }

  const novoTotal = fidelidade.pontos + pontos;
  let nivel = fidelidade.nivel;
  if (novoTotal >= 10001) nivel = "PLATINA";
  else if (novoTotal >= 3001) nivel = "OURO";
  else if (novoTotal >= 1001) nivel = "PRATA";
  else nivel = "BRONZE";

  await prisma.$transaction([
    prisma.pontosFidelidade.update({
      where: { clienteId },
      data: { pontos: novoTotal, nivel },
    }),
    prisma.transacaoPontos.create({
      data: {
        pontosId: fidelidade.id,
        tipo: "CREDITO",
        quantidade: pontos,
        descricao: `Crédito automático pela OS #${ordemId}`,
        ordemId,
        expiracao: tenant.validadeMeses
          ? new Date(Date.now() + tenant.validadeMeses * 30 * 24 * 60 * 60 * 1000)
          : null,
      },
    }),
  ]);
}

export async function resgatarPontos({
  tenant,
  clienteId,
  quantidade,
  descricao,
}: {
  tenant: Tenant;
  clienteId: string;
  quantidade: number;
  descricao?: string;
}) {
  if (!tenant.addonPontos) throw new Error("Addon de pontos não ativo");

  const fidelidade = await prisma.pontosFidelidade.findUnique({
    where: { clienteId },
  });
  if (!fidelidade) throw new Error("Cliente não possui saldo de pontos");

  if (quantidade < tenant.minimoResgate) {
    throw new Error(`Resgate mínimo: ${tenant.minimoResgate} pontos`);
  }
  if (fidelidade.pontos < quantidade) {
    throw new Error("Saldo insuficiente");
  }

  const novoTotal = fidelidade.pontos - quantidade;
  let nivel = fidelidade.nivel;
  if (novoTotal >= 10001) nivel = "PLATINA";
  else if (novoTotal >= 3001) nivel = "OURO";
  else if (novoTotal >= 1001) nivel = "PRATA";
  else nivel = "BRONZE";

  await prisma.$transaction([
    prisma.pontosFidelidade.update({
      where: { clienteId },
      data: { pontos: novoTotal, nivel },
    }),
    prisma.transacaoPontos.create({
      data: {
        pontosId: fidelidade.id,
        tipo: "DEBITO",
        quantidade,
        descricao: descricao || "Resgate de pontos",
      },
    }),
  ]);

  return { saldoAtual: novoTotal };
}
