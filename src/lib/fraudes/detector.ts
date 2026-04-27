import { prisma } from "@/lib/prisma";
import { enviarEmailCritico } from "@/lib/email-alertas";

interface AlertaInput {
  tenantId: string;
  tipo: string;
  gravidade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  descricao: string;
  entidadeId?: string;
}

async function registrarAlerta(input: AlertaInput) {
  const recente = await prisma.alertaFraude.findFirst({
    where: {
      tenantId: input.tenantId,
      tipo: input.tipo,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
  });
  if (recente) return null;

  if (input.gravidade === "CRITICA") {
    try { await enviarEmailCritico(input); } catch (e) { console.error(e); }
  }

  return prisma.alertaFraude.create({
    data: {
      tenantId: input.tenantId,
      tipo: input.tipo,
      gravidade: input.gravidade,
      descricao: input.descricao,
      entidadeId: input.entidadeId,
    },
  });
}

export async function verificarFraudes(tenantId: string, utilizadorId?: string) {
  const agora = new Date();
  const diaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
  const semanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const mesAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Cancelamentos em 24h
  const cancelamentosDia = await prisma.historicoOrdem.groupBy({
    by: ["usuarioNome"],
    where: { createdAt: { gte: diaAtras }, status: "CANCELADA" },
    _count: { id: true },
  });
  for (const item of cancelamentosDia) {
    if (item._count.id >= 3) {
      await registrarAlerta({ tenantId, tipo: "CANCELAMENTOS_24H", gravidade: "MEDIA", descricao: `${item.usuarioNome}: ${item._count.id} cancelamentos em 24h` });
    }
  }

  // Cancelamentos em 7 dias
  const cancelamentosSemana = await prisma.historicoOrdem.groupBy({
    by: ["usuarioNome"],
    where: { createdAt: { gte: semanaAtras }, status: "CANCELADA" },
    _count: { id: true },
  });
  for (const item of cancelamentosSemana) {
    if (item._count.id >= 5) {
      await registrarAlerta({ tenantId, tipo: "CANCELAMENTOS_7D", gravidade: "ALTA", descricao: `${item.usuarioNome}: ${item._count.id} cancelamentos em 7 dias` });
    }
  }

  // Descontos > 50%
  const ordens = await prisma.ordemServico.findMany({
    where: { tenantId, updatedAt: { gte: semanaAtras }, desconto: { gt: 0 } },
    select: { id: true, numero: true, total: true, desconto: true, totalMaoObra: true, totalPecas: true },
  });
  for (const os of ordens) {
    const totalSem = Number(os.totalMaoObra || 0) + Number(os.totalPecas || 0);
    if (totalSem > 0 && Number(os.desconto) / totalSem > 0.5) {
      await registrarAlerta({ tenantId, tipo: "DESCONTO_>50%", gravidade: "ALTA", descricao: `OS #${os.numero}: desconto ${os.desconto} (>50%)`, entidadeId: os.id });
    }
  }

  // Descontos acumulados
  const descontosAcumulados = await prisma.ordemServico.groupBy({
    by: ["usuarioId"],
    where: { tenantId, updatedAt: { gte: semanaAtras }, desconto: { gt: 0 } },
    _count: { id: true },
  });
  for (const item of descontosAcumulados) {
    if (item._count.id >= 3) {
      const ordensComDesconto = await prisma.ordemServico.findMany({
        where: { tenantId, usuarioId: item.usuarioId, updatedAt: { gte: semanaAtras }, desconto: { gt: 0 } },
        select: { desconto: true, totalMaoObra: true, totalPecas: true },
      });
      const descontosAltos = ordensComDesconto.filter(os => {
        const totalSem = Number(os.totalMaoObra || 0) + Number(os.totalPecas || 0);
        return totalSem > 0 && Number(os.desconto) / totalSem > 0.3;
      });
      if (descontosAltos.length >= 3) {
        await registrarAlerta({ tenantId, tipo: "DESCONTOS_ACUMULADOS", gravidade: "ALTA", descricao: `Utilizador ${item.usuarioId}: ${descontosAltos.length} descontos >30% em 7 dias` });
      }
    }
  }

  // OS sem pagamento (entregues há >4h)
  const osSemPagamento = await prisma.ordemServico.findMany({
    where: { tenantId, status: "ENTREGUE", pago: false, updatedAt: { lte: new Date(agora.getTime() - 4 * 60 * 60 * 1000) } },
    select: { id: true, numero: true, total: true },
  });
  for (const os of osSemPagamento) {
    await registrarAlerta({ tenantId, tipo: "OS_SEM_PAGAMENTO", gravidade: "MEDIA", descricao: `OS #${os.numero} entregue há >4h sem pagamento (${os.total})`, entidadeId: os.id });
  }

  // OS de curta duração (<30 min)
  const osRapidas = await prisma.ordemServico.findMany({
    where: {
      tenantId,
      createdAt: { gte: diaAtras },
      status: "ENTREGUE",
    },
    select: { id: true, numero: true, createdAt: true, updatedAt: true },
  });
  for (const os of osRapidas) {
    const diffMin = (new Date(os.updatedAt).getTime() - new Date(os.createdAt).getTime()) / (1000 * 60);
    if (diffMin < 30 && diffMin > 0) {
      await registrarAlerta({ tenantId, tipo: "OS_CURTA_DURACAO", gravidade: "MEDIA", descricao: `OS #${os.numero} criada e concluída em ${Math.round(diffMin)} min` });
    }
  }
}
