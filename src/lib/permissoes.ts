import { NivelAcesso } from "@prisma/client";

// Hierarquia: SUPER_ADMIN > ADMIN > GERENTE > TECNICO > RECEPCIONISTA > CLIENTE

type Recurso =
  | "dashboard"
  | "agenda"
  | "orcamentos"
  | "ordens"
  | "clientes"
  | "veiculos"
  | "servicos"
  | "estoque"
  | "financeiro"
  | "relatorios"
  | "usuarios"
  | "configuracoes"
  | "auditoria"
  | "addons";

// SUPER_ADMIN: acesso TOTAL a tudo (todos os tenants)
// ADMIN: acesso TOTAL ao seu tenant, mas NÃO pode gerir outros admins nem ver auditoria de outros
// GERENTE: acesso gerencial ao seu tenant (ordens, clientes, stock, relatórios, orçamentos)
// TECNICO: acesso técnico (dashboard, agenda, ordens)
// RECEPCIONISTA: acesso limitado (agenda, clientes, veículos, orçamentos)
// CLIENTE: sem acesso ao sistema interno

export const PERMISSOES: Record<NivelAcesso, Recurso[]> = {
  SUPER_ADMIN: [
    "dashboard", "agenda", "orcamentos", "ordens", "clientes", "veiculos",
    "servicos", "estoque", "financeiro", "relatorios", "usuarios",
    "configuracoes", "auditoria", "addons"
  ],
  ADMIN: [
    "dashboard", "agenda", "orcamentos", "ordens", "clientes", "veiculos",
    "servicos", "estoque", "financeiro", "relatorios", "usuarios",
    "configuracoes", "addons"
    // NOTA: ADMIN NÃO tem acesso a "auditoria" - isso é só para SUPER_ADMIN
  ],
  GERENTE: [
    "dashboard", "agenda", "orcamentos", "ordens", "clientes", "veiculos",
    "servicos", "estoque", "relatorios"
  ],
  TECNICO: [
    "dashboard", "agenda", "ordens"
  ],
  RECEPCIONISTA: [
    "dashboard", "agenda", "clientes", "veiculos", "orcamentos"
  ],
  CLIENTE: []
};

export function temPermissao(nivel: NivelAcesso, recurso: Recurso): boolean {
  return PERMISSOES[nivel]?.includes(recurso) ?? false;
}

export function checkApiPermissao(nivel: NivelAcesso | string, recurso: Recurso): boolean {
  return temPermissao(nivel as NivelAcesso, recurso);
}

/**
 * Verifica se um utilizador pode aceder a dados de um tenant específico.
 * SUPER_ADMIN pode aceder a todos os tenants.
 * Outros níveis só podem aceder ao seu próprio tenant.
 */
export function podeAcederTenant(nivel: string, tenantIdDoUtilizador: string, tenantIdDoSolicitado: string): boolean {
  if (nivel === "SUPER_ADMIN") return true;
  return tenantIdDoUtilizador === tenantIdDoSolicitado;
}

/**
 * Verifica se um utilizador pode gerir outros utilizadores.
 * Apenas SUPER_ADMIN pode criar/editar/remover qualquer utilizador.
 * ADMIN pode gerir utilizadores do seu tenant, exceto outros ADMINs e SUPER_ADMINs.
 */
export function podeGerirUtilizador(nivelExecutor: string, tenantIdExecutor: string, nivelAlvo: string, tenantIdAlvo: string): boolean {
  // SUPER_ADMIN pode gerir qualquer um
  if (nivelExecutor === "SUPER_ADMIN") return true;
  
  // ADMIN só pode gerir utilizadores do seu tenant
  if (nivelExecutor === "ADMIN") {
    // Não pode gerir SUPER_ADMIN nem outros ADMINs
    if (nivelAlvo === "SUPER_ADMIN" || nivelAlvo === "ADMIN") return false;
    // Só pode gerir se for do mesmo tenant
    return tenantIdExecutor === tenantIdAlvo;
  }
  
  // Outros níveis não podem gerir utilizadores
  return false;
}

export function podeGerenciarOrdem(
  usuarioNivel: NivelAcesso,
  usuarioId: string,
  ordemTecnicoId?: string | null,
  ordemUsuarioId?: string | null
): boolean {
  if (["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(usuarioNivel)) {
    return true;
  }
  if (usuarioNivel === "TECNICO") {
    return ordemTecnicoId === usuarioId || ordemUsuarioId === usuarioId;
  }
  if (usuarioNivel === "RECEPCIONISTA") {
    return ordemUsuarioId === usuarioId;
  }
  return false;
}
