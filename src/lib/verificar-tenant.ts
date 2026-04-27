import { prisma } from "@/lib/prisma";

/**
 * Verifica se o utilizador pode aceder a uma OS específica.
 * Retorna a OS se tiver acesso, ou null.
 */
export async function verificarTenantOS(osId: string, tenantId: string) {
  const os = await prisma.ordemServico.findUnique({
    where: { id: osId },
    select: { tenantId: true },
  });
  if (!os || os.tenantId !== tenantId) return null;
  return os;
}
