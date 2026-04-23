import { prisma } from "./prisma";

interface AuditEntry {
  tenantId: string;
  usuarioId?: string;
  usuarioNome: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
}

export async function registrarAuditoria({
  tenantId,
  usuarioId,
  usuarioNome,
  acao,
  entidade,
  entidadeId,
  dadosAnteriores,
  dadosNovos,
}: AuditEntry) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      usuarioId,
      usuarioNome,
      acao,
      entidade,
      entidadeId,
      dadosAnteriores,
      dadosNovos,
    },
  });
}
