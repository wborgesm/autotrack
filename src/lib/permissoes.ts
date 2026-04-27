import { NivelAcesso } from "@prisma/client";

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
  ],
  GERENTE: [
    "dashboard", "agenda", "orcamentos", "ordens", "clientes", "veiculos",
    "servicos", "estoque", "relatorios"
  ],
  TECNICO: [
    "dashboard", "agenda", "ordens"
  ],
  RECEPCIONISTA: [
    "dashboard", "agenda", "clientes", "veiculos", "orcamentos", "ordens", "servicos"
  ],
  CLIENTE: []
};

export function temPermissao(nivel: NivelAcesso, recurso: Recurso): boolean {
  return PERMISSOES[nivel]?.includes(recurso) ?? false;
}

export function checkApiPermissao(nivel: NivelAcesso | string, recurso: Recurso): boolean {
  return temPermissao(nivel as NivelAcesso, recurso);
}

export function podeGerenciarOrdem(
  usuarioNivel: NivelAcesso,
  usuarioId: string,
  ordemTecnicoId?: string | null,
  ordemUsuarioId?: string | null
): boolean {
  if (["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(usuarioNivel)) return true;
  if (usuarioNivel === "TECNICO") return ordemTecnicoId === usuarioId || ordemUsuarioId === usuarioId;
  if (usuarioNivel === "RECEPCIONISTA") return ordemUsuarioId === usuarioId;
  return false;
}

export function podeAcederTenant(nivel: string, tenantIdDoUtilizador: string, tenantIdDoSolicitado: string): boolean {
  if (nivel === "SUPER_ADMIN") return true;
  return tenantIdDoUtilizador === tenantIdDoSolicitado;
}

export function podeGerirUtilizador(nivelExecutor: string, tenantIdExecutor: string, nivelAlvo: string, tenantIdAlvo: string): boolean {
  if (nivelExecutor === "SUPER_ADMIN") return true;
  if (nivelExecutor === "ADMIN") {
    if (nivelAlvo === "SUPER_ADMIN" || nivelAlvo === "ADMIN") return false;
    return tenantIdExecutor === tenantIdAlvo;
  }
  return false;
}
