import { normalizeQuestion, extractKeywords } from "./chatbot-synonyms";

interface Aula {
  id: string;
  titulo: string;
  objetivo: string;
  passos: string[];
  dica?: string;
  proxima?: string; // id da próxima aula
}

// === CATÁLOGO DE AULAS ===
const aulas: Record<string, Aula> = {
  criar_os: {
    id: "criar_os",
    titulo: "Criar uma Ordem de Serviço",
    objetivo: "🎯 **Objetivo:** Criar uma ordem de serviço para um cliente",
    passos: [
      "Vai ao menu **Ordens** (ícone de lista no menu lateral)",
      "Clica em **+ Nova OS**",
      "Seleciona o **cliente** (se não existir, cria um novo primeiro)",
      "Seleciona o **veículo** do cliente",
      "Adiciona os **serviços** e/ou **peças** necessários",
      "Clica em **Criar OS**"
    ],
    dica: "💡 **Dica:** A OS começa no estado ABERTA. Podes mudar o estado conforme o trabalho avança.",
    proxima: "adicionar_pecas"
  },
  adicionar_pecas: {
    id: "adicionar_pecas",
    titulo: "Adicionar Peças a uma OS",
    objetivo: "🎯 **Objetivo:** Adicionar peças do stock a uma OS existente",
    passos: [
      "Abre a OS onde queres adicionar peças",
      "Procura a secção **Peças**",
      "Clica em **Adicionar Peça**",
      "Pesquisa a peça pelo nome ou código",
      "Define a **quantidade**",
      "Clica em **Confirmar**"
    ],
    dica: "💡 **Dica:** O sistema atualiza o stock automaticamente quando a OS for finalizada.",
    proxima: "finalizar_os"
  },
  finalizar_os: {
    id: "finalizar_os",
    titulo: "Finalizar uma Ordem de Serviço",
    objetivo: "🎯 **Objetivo:** Alterar o estado da OS para concluída",
    passos: [
      "Abre a OS que queres finalizar",
      "Localiza o seletor de **Estado**",
      "Escolhe o estado adequado (ex: PRONTA, ENTREGUE)",
      "Clica em **Guardar**"
    ],
    dica: "💡 **Dica:** Ao marcar como PRONTA ou ENTREGUE, o sistema envia notificações automáticas (WhatsApp/SMS) para o cliente com os dados da oficina.",
    proxima: "faturar"
  },
  faturar: {
    id: "faturar",
    titulo: "Emitir uma Fatura",
    objetivo: "🎯 **Objetivo:** Gerar uma fatura a partir de uma OS",
    passos: [
      "Abre a OS concluída",
      "Clica no botão **Emitir Fatura**",
      "O sistema envia os dados para o Moloni (se configurado)",
      "A fatura fica registada na OS"
    ],
    dica: "💡 **Dica:** Para configurar a faturação certificada, vai a **Configurações > Faturação**."
  },
  foto_stock: {
    id: "foto_stock",
    titulo: "Adicionar Foto a uma Peça",
    objetivo: "🎯 **Objetivo:** Colocar uma imagem numa peça do stock",
    passos: [
      "Vai ao menu **Stock**",
      "Clica em **+ Nova Peça** ou edita uma existente (ícone do lápis)",
      "Na secção **Imagem**, clica em **Carregar Imagem**",
      "Seleciona o ficheiro do teu computador",
      "A foto aparece automaticamente"
    ],
    dica: "💡 **Dica:** A imagem ajuda a identificar a peça rapidamente na lista de stock."
  },
  abrir_caixa: {
    id: "abrir_caixa",
    titulo: "Usar o Caixa (Ponto de Venda)",
    objetivo: "🎯 **Objetivo:** Abrir o caixa e fazer vendas",
    passos: [
      "Vai ao menu **Caixa** (logo abaixo do Painel)",
      "Define um **saldo inicial** (dinheiro de troco)",
      "Clica em **Abrir Caixa**",
      "Seleciona produtos/serviços e adiciona ao carrinho",
      "Escolhe o método de pagamento",
      "Clica em **Finalizar Venda**"
    ],
    dica: "💡 **Dica:** Cada venda gera uma receita automática no Financeiro e atualiza o stock. No final do dia, clica em **Fechar Caixa**."
  },
  ponto: {
    id: "ponto",
    titulo: "Bater o Ponto Eletrónico",
    objetivo: "🎯 **Objetivo:** Registar a entrada, pausa e saída",
    passos: [
      "Vai ao menu **Ponto Eletrónico**",
      "O sistema verifica automaticamente a tua localização",
      "Clica em **Iniciar** (entrada)",
      "Usa **Intervalo** para pausa (almoço)",
      "Clica em **Terminar** no final do dia"
    ],
    dica: "💡 **Dica:** Só funciona dentro do raio da oficina definido nas configurações."
  },
  cliente: {
    id: "cliente",
    titulo: "Criar um Cliente",
    objetivo: "🎯 **Objetivo:** Registar um novo cliente no sistema",
    passos: [
      "Vai ao menu **Clientes**",
      "Clica em **+ Novo Cliente**",
      "Preenche o **nome** (obrigatório)",
      "Adiciona NIF, telefone, email e morada (opcionais)",
      "Clica em **Guardar**"
    ],
    dica: "💡 **Dica:** Cada cliente tem um histórico completo de veículos e ordens de serviço.",
    proxima: "criar_veiculo"
  },
  criar_veiculo: {
    id: "criar_veiculo",
    titulo: "Adicionar um Veículo",
    objetivo: "🎯 **Objetivo:** Registar um veículo para um cliente",
    passos: [
      "Vai ao menu **Veículos**",
      "Clica em **+ Novo Veículo**",
      "Seleciona o **cliente**",
      "Preenche a **placa/matrícula** (obrigatório)",
      "Adiciona marca, modelo, ano, etc.",
      "Clica em **Guardar**"
    ],
    dica: "💡 **Dica:** O veículo fica associado ao cliente e podes ver todo o histórico de serviços.",
    proxima: "criar_os"
  },
  encomenda: {
    id: "encomenda",
    titulo: "Criar uma Encomenda",
    objetivo: "🎯 **Objetivo:** Encomendar peças para stock ou para um cliente",
    passos: [
      "Vai ao menu **Encomendas**",
      "Clica em **Nova Encomenda**",
      "Escolhe o tipo: **Oficina (Stock)** ou **Cliente (OS)**",
      "Adiciona as peças do stock",
      "Define a **data prevista**",
      "Clica em **Guardar**"
    ],
    dica: "💡 **Dica:** Quando receberes a encomenda, marca como RECEBIDA e o stock atualiza automaticamente."
  },
};

// === RESPOSTAS DIRETAS ===
const respostasDiretas: { chaves: string[]; resposta: string; modoAula?: string }[] = [
  // SAUDAÇÕES
  {
    chaves: ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite", "boas", "e aí", "e ai", "iae", "salve", "opa", "hello", "hey", "como vai", "tudo bem", "tudo bom"],
    resposta: "Olá! 😊 Sou o assistente virtual do AutoTrack e estou aqui para te ajudar a aprender a usar o sistema.\n\nPosso ensinar-te passo a passo:\n- Como criar uma OS\n- Como usar o Caixa\n- Como bater o ponto\n- Como emitir faturas\n- Como gerir o stock\n\nOu pede uma **aula rápida** dizendo \"quero aprender a criar OS\"!"
  },
  // CRIAR OS → ativa modo aula
  {
    chaves: ["criar os", "criar ordem", "nova os", "abrir os", "como criar os", "como criar ordem", "quero aprender a criar os", "ensina-me a criar os", "aula criar os"],
    resposta: "", // será preenchida pelo modo aula
    modoAula: "criar_os"
  },
  // ADICIONAR PEÇAS → ativa modo aula
  {
    chaves: ["adicionar peças", "adicionar peca", "como adicionar peças", "quero aprender a adicionar peças"],
    resposta: "",
    modoAula: "adicionar_pecas"
  },
  // FOTO NO STOCK → ativa modo aula
  {
    chaves: ["foto", "imagem", "foto stock", "foto peça", "foto estoque", "upload", "upload imagem", "por foto", "colocar foto", "adicionar foto", "adicionar imagem"],
    resposta: "",
    modoAula: "foto_stock"
  },
  // CAIXA → ativa modo aula
  {
    chaves: ["caixa", "abrir caixa", "fechar caixa", "vender", "venda", "como vender", "pdv", "quero aprender caixa"],
    resposta: "",
    modoAula: "abrir_caixa"
  },
  // PONTO → ativa modo aula
  {
    chaves: ["ponto", "bater ponto", "registar ponto", "ponto eletronico", "ponto eletrónico", "como bater ponto", "checkin", "check in"],
    resposta: "",
    modoAula: "ponto"
  },
  // FATURAR → ativa modo aula
  {
    chaves: ["faturar", "fatura", "emitir fatura", "gerar fatura", "como faturar", "como emitir fatura"],
    resposta: "",
    modoAula: "faturar"
  },
  // CLIENTE → ativa modo aula
  {
    chaves: ["cliente", "clientes", "cadastrar cliente", "criar cliente", "novo cliente", "quero aprender cliente"],
    resposta: "",
    modoAula: "cliente"
  },
  // ENCOMENDA → ativa modo aula
  {
    chaves: ["encomendar", "encomenda", "comprar", "fazer pedido", "pedido", "fornecedor"],
    resposta: "",
    modoAula: "encomenda"
  },
  // RESPOSTA PARA CONFUSÃO
  {
    chaves: ["nao entendi", "nao estou entendendo", "confuso", "como assim", "não percebi", "explica melhor", "mais detalhes", "pode repetir"],
    resposta: "Sem problema! 👍 Vamos simplificar.\n\nDiz-me o que queres fazer exatamente? Por exemplo:\n\n1. Criar uma ordem de serviço?\n2. Adicionar um cliente?\n3. Ver o stock?\n4. Emitir uma fatura?\n5. Bater o ponto?\n\nEscolhe uma opção ou descreve o que precisas e eu explico passo a passo, sem pressa!"
  },
  // RESPOSTA PARA ERRO
  {
    chaves: ["nao salvou", "erro", "nao deu certo", "travou", "ficou carregando", "nao funciona", "bug", "problema"],
    resposta: "Vamos verificar isso juntos! 👍\n\nPossíveis causas:\n1. Um campo obrigatório ficou por preencher (procura os campos marcados com *)\n2. A ligação à internet pode ter falhado\n3. O servidor pode estar temporariamente sobrecarregado\n\n👉 **Tenta isto:**\n- Verifica se todos os campos obrigatórios estão preenchidos\n- Clica novamente em **Guardar**\n- Se continuar a falhar, recarrega a página (F5) e tenta outra vez\n\nSe o problema persistir, diz-me o que aparece no ecrã para eu ajudar melhor!"
  },
  // RESPOSTA PARA "ONDE FICA"
  {
    chaves: ["onde fica", "onde esta", "onde encontrar", "onde vejo", "cadê", "nao acho", "nao encontro"],
    resposta: "Posso ajudar! 👍 O que estás a procurar exatamente?\n\nPor exemplo:\n- **Clientes** — menu lateral, ícone de pessoas\n- **Ordens de Serviço** — menu lateral, ícone de lista\n- **Stock** — menu lateral, ícone de caixa\n- **Encomendas** — menu lateral, ícone de embalagem\n- **Caixa** — menu lateral, logo abaixo do Painel\n- **Configurações** — menu lateral, ícone de engrenagem\n\nDiz-me qual é o módulo e eu explico exatamente onde está!"
  },
];

function formatarAula(aula: Aula): string {
  let resposta = `${aula.objetivo}\n\n📋 **Passos:**\n`;
  aula.passos.forEach((passo, i) => {
    resposta += `${i + 1}. ${passo}\n`;
  });
  if (aula.dica) {
    resposta += `\n${aula.dica}`;
  }
  if (aula.proxima) {
    const proximaAula = aulas[aula.proxima];
    if (proximaAula) {
      resposta += `\n\n❓ **Queres continuar?** Posso ensinar-te a seguir: **${proximaAula.titulo}**\nDiz \"próximo\" ou \"sim\" para continuar, ou pergunta outra coisa!`;
    }
  }
  return resposta;
}

export function chatbotResposta(pergunta: string): { resposta: string; precisaIA: boolean } {
  const normalized = normalizeQuestion(pergunta);
  const keywords = extractKeywords(normalized);
  
  // Procura nas respostas diretas
  for (const item of respostasDiretas) {
    const match = item.chaves.some(chave => {
      const normalizedChave = normalizeQuestion(chave);
      return keywords.includes(normalizedChave) || normalized.includes(normalizedChave);
    });
    
    if (match) {
      // Se tem modoAula, usa o formato de aula
      if (item.modoAula && aulas[item.modoAula]) {
        return { resposta: formatarAula(aulas[item.modoAula]), precisaIA: false };
      }
      return { resposta: item.resposta, precisaIA: false };
    }
  }
  
  // Se não encontrou nada, oferece ajuda genérica
  return {
    resposta: "Não tenho a certeza do que precisas. 🤔\n\n**Posso ajudar-te com:**\n- Como criar uma ordem de serviço?\n- Como bater o ponto?\n- Como emitir uma fatura?\n- Como adicionar foto a uma peça?\n- Como funciona o Caixa?\n- Onde fica o módulo X?\n\nDiz-me o que queres fazer e eu explico passo a passo! 😊",
    precisaIA: false
  };
}
