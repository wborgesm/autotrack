import { normalizeQuestion } from "./chatbot-synonyms";

// Palavras-chave que identificam assuntos do AutoTrack
const PALAVRAS_AUTOTRACK = [
  "os", "ordem", "ordens", "cliente", "clientes", "stock", "estoque",
  "fatura", "faturar", "caixa", "ponto", "veiculo", "pecas",
  "peça", "encomenda", "whatsapp", "agenda", "orcamento", "orçamento",
  "relatorio", "relatório", "financeiro", "utilizador", "permissao",
  "autotrack", "oficina", "servico", "técnico", "mecanico"
];

function eAssuntoAutotrack(texto: string): boolean {
  const norm = normalizeQuestion(texto);
  return PALAVRAS_AUTOTRACK.some(p => norm.includes(normalizeQuestion(p)));
}

// ================= TIPOS =================
interface Aula {
  id: string;
  titulo: string;
  objetivo: string;
  passos: string[];
  dica?: string;
  proxima?: string;
  tags: string[];
}

export interface ChatContexto {
  ultimaAulaId?: string;
}

export interface ChatResposta {
  resposta: string;
  precisaIA: boolean;
  proximoContexto?: ChatContexto;
  pesquisaDisponivel?: boolean;
  queryPesquisa?: string;
}

// ================= FUNÇÕES DE MATCH =================
function limpar(texto: string): string {
  return normalizeQuestion(texto)
    .replace(/vc\b/g, "voce")
    .replace(/tá\b/g, "esta")
    .replace(/tô\b/g, "estou")
    .replace(/q\b/g, "que")
    .replace(/pq\b/g, "porque")
    .replace(/tb\b/g, "tambem")
    .replace(/\s+/g, " ")
    .trim();
}

function palavrasEmComum(frase: string, chave: string): number {
  const palavrasFrase = new Set(frase.split(" ").filter(p => p.length > 1));
  const palavrasChave = chave.split(" ");
  let count = 0;
  for (const p of palavrasChave) {
    if (palavrasFrase.has(p)) count++;
  }
  return count;
}

function matchFlexivel(input: string, chaves: string[]): boolean {
  for (const chave of chaves) {
    const limpa = limpar(chave);
    const comum = palavrasEmComum(input, limpa);
    const totalChave = limpa.split(" ").filter(p => p.length > 1).length;
    if (comum >= 2 || (totalChave <= 2 && comum === totalChave)) return true;
  }
  return false;
}

// ================= CATÁLOGO DE AULAS =================
const aulas: Record<string, Aula> = {
  criar_os: {
    id: "criar_os",
    titulo: "Criar uma Ordem de Serviço",
    objetivo: "🎯 Criar uma ordem de serviço para um cliente",
    passos: [
      "Menu **Ordens** → **+ Nova OS**",
      "Seleciona o **cliente** (ou cria um novo)",
      "Escolhe o **veículo**",
      "Adiciona **serviços** e/ou **peças**",
      "Clica em **Criar OS**"
    ],
    dica: "💡 A OS fica no estado ABERTA e podes mudar o estado ao longo do trabalho.",
    proxima: "adicionar_pecas",
    tags: ["criar os", "nova os", "abrir ordem", "ordem servico", "os"]
  },
  adicionar_pecas: {
    id: "adicionar_pecas",
    titulo: "Adicionar Peças a uma OS",
    objetivo: "🎯 Adicionar peças do stock a uma OS existente",
    passos: [
      "Abre a OS",
      "Vai à secção **Peças**",
      "Clica em **Adicionar Peça**",
      "Pesquisa pela peça e define a quantidade",
      "Confirma"
    ],
    dica: "💡 O stock atualiza automaticamente quando a OS for finalizada.",
    proxima: "finalizar_os",
    tags: ["adicionar pecas", "por peca", "colocar peca", "material", "estoque os"]
  },
  finalizar_os: {
    id: "finalizar_os",
    titulo: "Finalizar uma Ordem de Serviço",
    objetivo: "🎯 Alterar o estado da OS para concluída",
    passos: [
      "Abre a OS",
      "No seletor de **Estado**, escolhe PRONTA ou ENTREGUE",
      "Clica em **Guardar**"
    ],
    dica: "💡 Ao marcar como PRONTA/ENTREGUE, o sistema envia notificações (WhatsApp/SMS) ao cliente.",
    proxima: "faturar",
    tags: ["finalizar os", "concluir os", "terminar os", "pronta", "entregue", "fechar os"]
  },
  faturar: {
    id: "faturar",
    titulo: "Emitir uma Fatura",
    objetivo: "🎯 Gerar uma fatura a partir de uma OS",
    passos: [
      "Abre a OS concluída",
      "Clica em **Emitir Fatura**",
      "A fatura é enviada para o Moloni (se configurado)",
      "Fica registada na OS"
    ],
    dica: "💡 Para configurar a faturação certificada: **Configurações > Faturação**.",
    tags: ["faturar", "emitir fatura", "criar fatura", "gerar fatura", "fatura", "moloni"]
  },
  foto_stock: {
    id: "foto_stock",
    titulo: "Adicionar Foto a uma Peça",
    objetivo: "🎯 Colocar imagem numa peça do stock",
    passos: [
      "Menu **Stock** → **+ Nova Peça** ou editar (ícone lápis)",
      "Secção **Imagem** → **Carregar Imagem**",
      "Seleciona o ficheiro do computador"
    ],
    dica: "💡 Ajuda a identificar peças rapidamente.",
    tags: ["foto", "imagem", "upload", "foto peca", "imagem stock", "carregar imagem", "anexar"]
  },
  abrir_caixa: {
    id: "abrir_caixa",
    titulo: "Usar o Caixa (Ponto de Venda)",
    objetivo: "🎯 Abrir o caixa e fazer vendas",
    passos: [
      "Menu **Caixa** (abaixo do Painel)",
      "Define o **saldo inicial**",
      "Clica em **Abrir Caixa**",
      "Adiciona produtos ao carrinho e escolhe o método de pagamento",
      "Clica em **Finalizar Venda**"
    ],
    dica: "💡 Cada venda gera uma receita automática no Financeiro. No fim do dia, clica **Fechar Caixa**.",
    tags: ["caixa", "vender", "venda", "pdv", "ponto venda", "abrir caixa", "fechar caixa"]
  },
  ponto: {
    id: "ponto",
    titulo: "Bater o Ponto Eletrónico",
    objetivo: "🎯 Registar entrada, pausa e saída",
    passos: [
      "Menu **Ponto Eletrónico**",
      "O sistema verifica a tua localização",
      "Clica **Iniciar** (entrada)",
      "Usa **Intervalo** para pausa",
      "Clica **Terminar** no final do dia"
    ],
    dica: "💡 Funciona dentro do raio da oficina definido nas configurações.",
    tags: ["ponto", "bater ponto", "registar ponto", "checkin", "check in", "entrada", "saida", "intervalo"]
  },
  cliente: {
    id: "cliente",
    titulo: "Criar um Cliente",
    objetivo: "🎯 Registar um novo cliente",
    passos: [
      "Menu **Clientes** → **+ Novo Cliente**",
      "Preenche o nome (obrigatório)",
      "Adiciona NIF, telefone, email",
      "Clica em **Guardar**"
    ],
    dica: "💡 Cada cliente tem um histórico completo.",
    proxima: "criar_veiculo",
    tags: ["cliente", "novo cliente", "cadastrar cliente", "criar cliente"]
  },
  criar_veiculo: {
    id: "criar_veiculo",
    titulo: "Adicionar um Veículo",
    objetivo: "🎯 Registar veículo para um cliente",
    passos: [
      "Menu **Veículos** → **+ Novo Veículo**",
      "Seleciona o cliente",
      "Preenche placa/matrícula",
      "Adiciona marca, modelo, etc.",
      "Clica em **Guardar**"
    ],
    dica: "💡 O veículo fica associado ao cliente e podes ver o histórico de serviços.",
    proxima: "criar_os",
    tags: ["veiculo", "adicionar veiculo", "cadastrar veiculo", "carro", "moto", "matricula", "placa"]
  },
  encomenda: {
    id: "encomenda",
    titulo: "Criar uma Encomenda",
    objetivo: "🎯 Encomendar peças ou produtos",
    passos: [
      "Menu **Encomendas** → **Nova Encomenda**",
      "Escolhe o tipo: **Oficina** ou **Cliente**",
      "Adiciona as peças",
      "Define data prevista",
      "Clica **Guardar**"
    ],
    dica: "💡 Quando receberes, marca como RECEBIDA para atualizar o stock.",
    tags: ["encomenda", "comprar", "pedido", "fornecedor"]
  },
  whatsapp: {
    id: "whatsapp",
    titulo: "Configurar o WhatsApp",
    objetivo: "🔐 RESTRITO a SUPER_ADMIN.\nSe não és super administrador, consulta o super admin da tua oficina.\n\n🎯 Ligar o WhatsApp ao sistema",
    passos: [
      "Menu **Configurações > WhatsApp**",
      "Verifica se existe um QR Code",
      "Abre o WhatsApp no telemóvel",
      "Escaneia o código",
      "Estado deve mudar para CONNECTED"
    ],
    dica: "💡 A sessão fica guardada e não precisas repetir após reinícios. Só o SUPER_ADMIN pode ver o QR Code.",
    tags: ["whatsapp", "conectar whatsapp", "qr code", "escanear", "ligar whatsapp"]
  },
  permissoes: {
    id: "permissoes",
    titulo: "Gerir Utilizadores e Permissões",
    objetivo: "🔐 RESTRITO a SUPER_ADMIN ou ADMIN.\nSe não tens permissão, pede ao super admin da tua oficina.\n\n🎯 Criar e gerir utilizadores do sistema",
    passos: [
      "Menu **Utilizadores** (apenas ADMIN/SUPER_ADMIN)",
      "Clica **+ Novo Utilizador**",
      "Define nome, email, nível de acesso",
      "O sistema envia convite por email"
    ],
    dica: "💡 SUPER_ADMIN pode criar contas ADMIN. ADMIN pode criar GERENTE, TECNICO, RECEPCIONISTA. CLIENTE é para o portal.",
    tags: ["usuario", "utilizador", "permissao", "permissões", "acesso", "convidar", "criar conta", "nivel"]
  },
  orcamento: {
    id: "orcamento",
    titulo: "Criar um Orçamento",
    objetivo: "🎯 Fazer um orçamento para um cliente",
    passos: [
      "Menu **Orçamentos** → **+ Novo Orçamento**",
      "Seleciona o cliente e veículo",
      "Adiciona serviços/peças",
      "O estado inicial é PENDENTE"
    ],
    dica: "💡 Podes converter um orçamento em OS clicando em **Converter**.",
    tags: ["orcamento", "orcar", "orçamento"]
  },
  agenda: {
    id: "agenda",
    titulo: "Usar a Agenda",
    objetivo: "🎯 Agendar serviços e gerir marcações",
    passos: [
      "Menu **Agenda**",
      "Clica num slot de horário",
      "Preenche cliente, veículo, serviço",
      "Confirma o agendamento"
    ],
    dica: "💡 Os agendamentos podem ser convertidos em OS diretamente.",
    tags: ["agenda", "agendamento", "marcar", "marcacao", "horario", "agendar"]
  },
  stock_minimo: {
    id: "stock_minimo",
    titulo: "Verificar Stock Mínimo e Alertas",
    objetivo: "🎯 Saber que peças estão a acabar",
    passos: [
      "Menu **Stock**",
      "As peças com quantidade abaixo do mínimo aparecem destacadas",
      "Clica numa peça para fazer encomenda"
    ],
    dica: "💡 Configura o stock mínimo em cada peça para receberes alertas.",
    tags: ["stock", "estoque", "minimo", "alerta", "repor", "acabando"]
  },
  relatorios: {
    id: "relatorios",
    titulo: "Ver Relatórios",
    objetivo: "🎯 Consultar relatórios de vendas, OS e finanças",
    passos: [
      "Menu **Relatórios**",
      "Escolhe o tipo: **Vendas**, **OS**, **Financeiro**, etc.",
      "Define o período",
      "Analisa os gráficos e tabelas"
    ],
    dica: "💡 Usa os relatórios para acompanhar o desempenho da oficina.",
    tags: ["relatorio", "relatorios", "grafico", "vendas", "faturamento", "dashboard"]
  },
  alertas: {
    id: "alertas",
    titulo: "Ver Alertas do Sistema",
    objetivo: "🎯 Verificar alertas de stock, fraude, e segurança",
    passos: [
      "Menu **Alertas** (apenas ADMIN/SUPER_ADMIN)",
      "Vê a lista de alertas pendentes",
      "Clica num alerta para ver detalhes",
      "Marca como resolvido quando tratado"
    ],
    dica: "💡 Configura os alertas em **Configurações > Notificações**.",
    tags: ["alerta", "alertas", "aviso", "notificacao", "fraude", "seguranca"]
  }
};

// ================= RESPOSTAS DIRETAS =================
interface RespostaDireta {
  chaves: string[];
  resposta?: string;
  modoAula?: string;
}

const respostas: RespostaDireta[] = [
  {
    chaves: ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite", "boas", "e aí", "e ai", "iae", "salve", "opa", "hello", "hey", "como vai", "tudo bem", "tudo bom", "fala", "coe"],
    resposta: "Olá! 😊 Sou o assistente do AutoTrack.\n\nPosso ajudar-te com:\n- Criar OS\n- Caixa\n- Ponto\n- Faturas\n- Stock\n- WhatsApp\n- Permissões\n- Agenda\n- Encomendas\n- Relatórios\n\nPede uma **aula rápida** dizendo \"como criar OS\" ou \"abrir caixa\"."
  },
  { chaves: ["criar os", "criar ordem", "nova os", "abrir os", "como criar os", "ensina criar os", "aula os", "ordem servico"], modoAula: "criar_os" },
  { chaves: ["adicionar peca", "adicionar material", "por peca", "colocar peca", "adicionar pecas"], modoAula: "adicionar_pecas" },
  { chaves: ["finalizar os", "concluir os", "os pronta", "os entregue", "terminar os", "fechar os"], modoAula: "finalizar_os" },
  { chaves: ["faturar", "fatura", "emitir fatura", "gerar fatura", "como faturar", "cobrar"], modoAula: "faturar" },
  { chaves: ["foto", "imagem", "foto stock", "foto peca", "upload", "anexar", "carregar imagem"], modoAula: "foto_stock" },
  { chaves: ["caixa", "abrir caixa", "fechar caixa", "vender", "venda", "pdv", "ponto venda", "como vender"], modoAula: "abrir_caixa" },
  { chaves: ["ponto", "bater ponto", "registar ponto", "checkin", "check in", "entrada", "saida"], modoAula: "ponto" },
  { chaves: ["cliente", "clientes", "cadastrar cliente", "criar cliente", "novo cliente"], modoAula: "cliente" },
  { chaves: ["veiculo", "veículo", "adicionar veiculo", "cadastrar veiculo", "carro", "moto", "matricula", "placa"], modoAula: "criar_veiculo" },
  { chaves: ["encomendar", "encomenda", "comprar", "pedido", "fornecedor", "repor"], modoAula: "encomenda" },
  { chaves: ["whatsapp", "conectar whatsapp", "qr code", "escanear", "ligar whatsapp", "whats"], modoAula: "whatsapp" },
  { chaves: ["usuario", "utilizador", "permissao", "permissões", "acesso", "convidar", "criar conta"], modoAula: "permissoes" },
  { chaves: ["orcamento", "orçamento", "orcar"], modoAula: "orcamento" },
  { chaves: ["agenda", "agendamento", "marcar", "marcacao", "horario", "agendar"], modoAula: "agenda" },
  { chaves: ["stock minimo", "estoque baixo", "pecas acabando", "alerta stock", "repor stock", "estoque minimo"], modoAula: "stock_minimo" },
  { chaves: ["relatorio", "relatorios", "grafico", "faturamento", "dashboard"], modoAula: "relatorios" },
  { chaves: ["alerta", "alertas", "aviso", "notificacao"], modoAula: "alertas" },
  {
    chaves: ["nao entendi", "confuso", "nao percebi", "explica melhor", "mais detalhes", "pode repetir", "como assim", "nao compreendi"],
    resposta: "Vou simplificar! 👍\n\nEscolhe uma opção:\n1. Criar OS\n2. Usar Caixa\n3. Bater ponto\n4. Emitir fatura\n5. Configurar WhatsApp\n6. Ver stock mínimo\n7. Ver relatórios\n\nDiz-me o número ou descreve o que queres fazer."
  },
  {
    chaves: ["nao salvou", "erro", "travou", "nao funciona", "bug", "problema", "falhou", "nao deu"],
    resposta: "Vamos ver isso juntos! 🛠️\n\n1. Verifica campos obrigatórios (*)\n2. Recarrega a página (F5)\n3. Tenta novamente\n\nSe continuar, descreve o que aparece no ecrã."
  },
  {
    chaves: ["onde fica", "onde esta", "onde encontrar", "onde vejo", "cade", "nao acho", "nao encontro", "como chegar"],
    resposta: "Posso ajudar! 🔍\n\n- **Clientes** → ícone de pessoas\n- **Ordens** → ícone de lista\n- **Stock** → ícone de caixa\n- **Caixa** → abaixo do Painel\n- **Configurações** → engrenagem\n- **Relatórios** → ícone de gráfico\n\nDiz qual o módulo e indico o caminho."
  },
  {
    chaves: ["configuracao", "configurações", "painel admin", "ajustes", "definições", "gestao", "admin"],
    resposta: "⚠️ As configurações do sistema (WhatsApp, faturação, segurança, etc.) são acessíveis apenas a SUPER_ADMIN.\n\nSe precisas de alterar algo, consulta o **super administrador da Autotrack** da tua oficina."
  },
  {
    chaves: ["obrigado", "obrigada", "valeu", "brigado", "mt obrigado", "agradeco", "grato"],
    resposta: "De nada! 😊\nEstou sempre aqui para ajudar. Precisas de mais alguma coisa?"
  },
  {
    chaves: ["ajuda", "help", "socorro", "como usar", "como funciona", "guia", "manual"],
    resposta: "Claro! 🚀 O AutoTrack tem vários módulos. Diz-me o que queres fazer:\n\n- **Criar OS** — para ordens de serviço\n- **Caixa** — para vendas rápidas\n- **Stock** — para gerir peças\n- **Agenda** — para marcações\n- **Relatórios** — para análises\n\nOu pergunta diretamente: \"como criar uma OS?\" e eu mostro o passo a passo."
  },
  {
    chaves: ["horario", "funcionamento", "abertura", "fechado", "expediente"],
    resposta: "🏪 O horário de funcionamento depende de cada oficina. Verifica com o teu gerente ou nas **Configurações** da oficina.\n\nPrecisas de ajuda com mais alguma coisa?"
  },
  {
    chaves: ["preco", "preço", "custo", "valor", "quanto custa", "mensalidade", "plano"],
    resposta: "💬 Para informações sobre preços, planos ou faturação, consulta o **super administrador da Autotrack** da tua oficina ou o nosso site autotrack.pt.\n\nPosso ajudar-te com mais alguma coisa sobre o sistema?"
  },
  {
    chaves: ["app", "aplicativo", "telemovel", "telemóvel", "celular", "mobile", "android", "iphone"],
    resposta: "📱 O AutoTrack funciona em qualquer navegador no telemóvel! Basta aceder a **sistema.autotrack.pt** no teu telemóvel e fazer login.\n\nNão precisas instalar nada — é 100% web e responsivo."
  },
  {
    chaves: ["gps", "localizacao", "localização", "rastreamento", "tracker", "traccar"],
    resposta: "📍 O módulo de GPS (via Autotrack) permite rastrear veículos em tempo real.\n\nPara ativar:\n1. Menu **Configurações > GPS** (SUPER_ADMIN)\n2. Insere os dados do servidor Autotrack\n3. Associa veículos aos dispositivos\n\nPrecisas de ajuda mais detalhada?"
  },
];

// ================= FORMATAÇÃO =================
function formatarAula(aula: Aula): string {
  const passos = aula.passos.map((p, i) => `${i + 1}. ${p}`).join("\n");
  let msg = `${aula.objetivo}\n\n📋 **Passos:**\n${passos}`;
  if (aula.dica) msg += `\n\n${aula.dica}`;
  if (aula.proxima && aulas[aula.proxima]) {
    msg += `\n\n❓ **Queres continuar?** A seguir: **${aulas[aula.proxima].titulo}**\nDiz \"próximo\" ou \"sim\"!`;
  }
  return msg;
}

// ================= MOTOR PRINCIPAL =================
export function chatbotResposta(pergunta: string, contexto?: ChatContexto, nomeUtilizador?: string): ChatResposta {
  const norm = limpar(pergunta);
  if (!norm) return { resposta: "Diz-me o que precisas! 😊", precisaIA: false };

  if (contexto?.ultimaAulaId) {
    const aulaAtual = aulas[contexto.ultimaAulaId];
    if (aulaAtual?.proxima) {
      const proxId = aulaAtual.proxima;
      const comandos = ["próximo", "proximo", "sim", "continuar", "continua", "yes", "ok", "avancar", "seguinte", "bora"];
      if (comandos.some(cmd => norm === cmd || norm.startsWith(cmd))) {
        const proximaAula = aulas[proxId];
        if (proximaAula) {
          return {
            resposta: formatarAula(proximaAula),
            precisaIA: false,
            proximoContexto: { ultimaAulaId: proxId }
          };
        }
      }
    }
  }

  for (const item of respostas) {
    const match = matchFlexivel(norm, item.chaves);
    if (!match) continue;
    if (item.modoAula && aulas[item.modoAula]) {
      const aula = aulas[item.modoAula];
      return {
        resposta: formatarAula(aula),
        precisaIA: false,
        proximoContexto: { ultimaAulaId: item.modoAula }
      };
    }
      if (item.resposta) {
        if (item.chaves[0] === "ola" && nomeUtilizador) {
          return {
            resposta: `Olá, **${nomeUtilizador}**! 😊\n\nSou o assistente do AutoTrack e estou aqui para te ajudar.\n\nPodes perguntar-me como criar uma OS, usar o caixa, bater o ponto, entre outros.`,
            precisaIA: false,
          };
        }
        return { resposta: item.resposta, precisaIA: false };
      }
  }

  for (const aula of Object.values(aulas)) {
    if (matchFlexivel(norm, aula.tags)) {
      return {
        resposta: formatarAula(aula),
        precisaIA: false,
        proximoContexto: { ultimaAulaId: aula.id }
      };
    }
  }

  // Fallback: se é assunto AutoTrack mas não temos aula, oferece pesquisa web
  if (eAssuntoAutotrack(norm)) {
    return {
      resposta: `Não tenho uma aula específica sobre isso. 🤔\n\nPosso **pesquisar na internet** por ti? Clica abaixo para pesquisar: **"${pergunta.slice(0, 80)}"**`,
      precisaIA: false,
      pesquisaDisponivel: true,
      queryPesquisa: pergunta,
    };
  }

  // Não é assunto AutoTrack → sem pesquisa
  return {
    resposta: "Não sei responder a isso. 😔\n\nSou o assistente do AutoTrack e estou aqui para te ajudar com o sistema. Pergunta-me sobre ordens de serviço, stock, caixa, clientes, ou outro módulo!",
    precisaIA: false,
  };
}
