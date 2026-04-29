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

// Níveis disponíveis para cada nível (pode criar estes níveis)
export const NIVEIS_CRIAVEIS: Record<NivelAcesso, NivelAcesso[]> = {
  SUPER_ADMIN: ["ADMIN", "GERENTE", "TECNICO", "RECEPCIONISTA", "CLIENTE"],
  ADMIN:      ["GERENTE", "TECNICO", "RECEPCIONISTA", "CLIENTE"],
  GERENTE:    ["TECNICO", "RECEPCIONISTA", "CLIENTE"],
  TECNICO:    [],
  RECEPCIONISTA: [],
  CLIENTE:    [],
};

// Permissões base por nível
const PERMISSOES_BASE: Record<NivelAcesso, Recurso[]> = {
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

/** Verifica se o utilizador tem acesso a um recurso (base + extras) */
export function temPermissao(
  nivel: NivelAcesso,
  recurso: Recurso,
  permissoesExtras: string[] = []
): boolean {
  const base = PERMISSOES_BASE[nivel] ?? [];
  if (base.includes(recurso)) return true;
  return permissoesExtras.includes(recurso);
}

/** Valida se um nível pode ser atribuído por outro */
export function podeAtribuirNivel(criador: NivelAcesso, alvo: NivelAcesso): boolean {
  return (NIVEIS_CRIAVEIS[criador] ?? []).includes(alvo);
}

/** Retorna a lista de recursos que podem ser adicionados a um nível base */
export function recursosExtrasDisponiveis(nivel: NivelAcesso): Recurso[] {
  const base = PERMISSOES_BASE[nivel] ?? [];
  return TODOS_RECURSOS.filter(r => !base.includes(r));
}

// Funções mantidas para compatibilidade com as APIs existentes

/** Versão simplificada para uso nas APIs (sem permissões extras) */
export function checkApiPermissao(nivel: string, recurso: Recurso, permissoesExtras?: string[]): boolean {
  return temPermissao(nivel as NivelAcesso, recurso, permissoesExtras ?? []);
}

/** Regra de acesso a ordens de serviço */
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
