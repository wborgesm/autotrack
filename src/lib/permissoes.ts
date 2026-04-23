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
    "configuracoes", "auditoria", "addons"
  ],
  GERENTE: [
    "dashboard", "agenda", "orcamentos", "ordens", "clientes", "veiculos",
    "servicos", "estoque", "relatorios", "auditoria"
  ],
  TECNICO: [
    "dashboard", "agenda", "ordens"
  ],
  RECEPCIONISTA: [
    "dashboard", "agenda", "orcamentos", "clientes", "veiculos", "ordens"
  ],
  CLIENTE: []
};

export function temPermissao(nivel: NivelAcesso, recurso: Recurso): boolean {
  return PERMISSOES[nivel]?.includes(recurso) ?? false;
}

export function checkApiPermissao(nivel: NivelAcesso, recurso: Recurso): boolean {
  return temPermissao(nivel, recurso);
}

export function podeGerenciarOrdem(
  usuarioNivel: NivelAcesso,
  usuarioId: string,
  ordemTecnicoId?: string | null,
  ordemUsuarioId?: string | null
): boolean {
  // SUPER_ADMIN, ADMIN e GERENTE podem gerir qualquer OS
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
