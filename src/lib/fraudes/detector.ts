import { prisma } from "@/lib/prisma";

export interface AlertaInput {
  tenantId: string;
  tipo: string;
  gravidade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  descricao: string;
  entidadeId?: string;
}

export async function registrarAlerta(input: AlertaInput) {
  return prisma.alertaFraude.create({
    data: { tenantId: input.tenantId, tipo: input.tipo, gravidade: input.gravidade, descricao: input.descricao, entidadeId: input.entidadeId },
  });
}

export async function verificarFraudes(tenantId: string) {
  const agora = new Date();
  const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

  // Múltiplos cancelamentos
  const cancelamentos = await prisma.historicoOrdem.groupBy({
    by: ["usuarioNome"],
    where: { createdAt: { gte: umDiaAtras }, status: "CANCELADA" },
    _count: { id: true },
  });
  for (const item of cancelamentos) {
    if (item._count.id >= 3) {
      await registrarAlerta({ tenantId, tipo: "MULTIPLOS_CANCELAMENTOS", gravidade: "MEDIA", descricao: `${item.usuarioNome} cancelou ${item._count.id} OS nas últimas 24h` });
    }
  }

  // OS sem pagamento
  const osSemPagamento = await prisma.ordemServico.findMany({
    where: { tenantId, status: "ENTREGUE", pago: false, updatedAt: { gte: umDiaAtras } },
    select: { id: true, numero: true, total: true },
  });
  for (const os of osSemPagamento) {
    await registrarAlerta({ tenantId, tipo: "OS_SEM_PAGAMENTO", gravidade: "MEDIA", descricao: `OS #${os.numero} entregue sem pagamento (${os.total})`, entidadeId: os.id });
  }

  // Descontos excessivos
  const ordens = await prisma.ordemServico.findMany({
    where: { tenantId, updatedAt: { gte: umDiaAtras }, desconto: { gt: 0 } },
    select: { id: true, numero: true, total: true, desconto: true, totalMaoObra: true, totalPecas: true },
  });
  for (const os of ordens) {
    const totalSem = Number(os.totalMaoObra || 0) + Number(os.totalPecas || 0);
    if (totalSem > 0 && Number(os.desconto) / totalSem > 0.5) {
      await registrarAlerta({ tenantId, tipo: "DESCONTO_EXCESSIVO", gravidade: "ALTA", descricao: `OS #${os.numero} com desconto de ${os.desconto} (>50%)`, entidadeId: os.id });
    }
  }
}
