import { NivelAcesso } from "@prisma/client";

export type Recurso =
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

export const TODOS_RECURSOS: Recurso[] = [
  "dashboard", "agenda", "orcamentos", "ordens", "clientes", "veiculos",
  "servicos", "estoque", "financeiro", "relatorios", "usuarios",
  "configuracoes", "auditoria", "addons"
];

export const NIVEIS_CRIAVEIS: Record<NivelAcesso, NivelAcesso[]> = {
  SUPER_ADMIN: ["ADMIN", "GERENTE", "TECNICO", "RECEPCIONISTA", "CLIENTE"],
  ADMIN:      ["GERENTE", "TECNICO", "RECEPCIONISTA", "CLIENTE"],
  GERENTE:    ["TECNICO", "RECEPCIONISTA", "CLIENTE"],
  TECNICO:    [],
  RECEPCIONISTA: [],
  CLIENTE:    [],
};

export const PERMISSOES_BASE: Record<NivelAcesso, Recurso[]> = {
  SUPER_ADMIN: TODOS_RECURSOS,
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
    "dashboard", "agenda", "clientes", "veiculos", "orcamentos", "ordens", "servicos", "estoque"
  ],
  CLIENTE: []
};

/** Verifica se o utilizador tem acesso a um recurso, usando a lista personalizada ou, se vazia, o nível base. */
export function temPermissao(
  nivel: NivelAcesso,
  recurso: Recurso,
  permissoes?: string[]
): boolean {
  if (permissoes && permissoes.length > 0) {
    return permissoes.includes(recurso);
  }
  return (PERMISSOES_BASE[nivel] ?? []).includes(recurso);
}

export function podeAtribuirNivel(criador: NivelAcesso, alvo: NivelAcesso): boolean {
  return (NIVEIS_CRIAVEIS[criador] ?? []).includes(alvo);
}

export function recursosExtrasDisponiveis(nivel: NivelAcesso): Recurso[] {
  const base = PERMISSOES_BASE[nivel] ?? [];
  return TODOS_RECURSOS.filter(r => !base.includes(r));
}

export function checkApiPermissao(nivel: string, recurso: Recurso, permissoes?: string[]): boolean {
  return temPermissao(nivel as NivelAcesso, recurso, permissoes);
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
