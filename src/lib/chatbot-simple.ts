import { normalizeQuestion, extractKeywords } from "./chatbot-synonyms";
import { aleatorio, saudacoes, naoEntendi, sugestoes, finalizacao } from "./chatbot-frases";

/**
 * RESPOSTAS DIRETAS — curtas e objetivas
 * Cada entrada tem palavras-chave e uma resposta pronta.
 * Nunca mostra o documento completo.
 */
const respostasDiretas: { chaves: string[]; resposta: string }[] = [
  // === SAUDAÇÕES ===
  {
    chaves: ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite", "boas", "e aí", "e ai", "iae", "salve", "opa", "hello", "hey", "como vai", "tudo bem", "tudo bom"],
    resposta: "Olá! 😊 Em que posso ajudar? Podes perguntar sobre:
- Como criar uma OS
- Como bater o ponto
- Como emitir uma fatura
- Como adicionar foto a uma peça
- Como funciona o caixa

Estou aqui para ajudar!"
  },
  // === FATURAS ===
  {
    chaves: ["faturar", "fatura", "emitir fatura", "gerar fatura", "como faturar", "como emitir fatura"],
    resposta: "Para emitir uma fatura:\n1. Vai a **Ordens**\n2. Clica na OS que queres faturar\n3. Clica em **Emitir Fatura**\n4. O sistema envia para o Moloni (se estiver configurado)."
  },
  // === CRIAR OS ===
  {
    chaves: ["criar os", "criar ordem", "nova os", "abrir os", "como criar os", "como criar ordem"],
    resposta: "Para criar uma Ordem de Serviço:\n1. Vai a **Ordens**\n2. Clica em **+ Nova OS**\n3. Seleciona cliente e veículo\n4. Adiciona serviços e/ou peças\n5. Clica em **Criar OS**"
  },
  // === FOTO NO STOCK ===
  {
    chaves: ["foto", "imagem", "foto stock", "foto peça", "foto estoque", "upload", "upload imagem", "por foto", "colocar foto", "adicionar foto", "adicionar imagem"],
    resposta: "Para adicionar foto a uma peça:\n1. Vai a **Stock**\n2. Clica em **+ Nova Peça** ou edita uma existente\n3. Na secção **Imagem**, clica em **Carregar Imagem**\n4. Seleciona o ficheiro do teu computador\n5. A foto aparece automaticamente."
  },
  // === PONTO ELETRÓNICO ===
  {
    chaves: ["ponto", "bater ponto", "registar ponto", "ponto eletronico", "ponto eletrónico", "como bater ponto", "checkin", "check in"],
    resposta: "Para bater o ponto:\n1. Vai a **Ponto Eletrónico**\n2. O sistema verifica a tua localização\n3. Clica em **Iniciar** (entrada), **Intervalo** (pausa) ou **Terminar** (saída).\n\n⚠️ Só funciona dentro do raio da oficina."
  },
  // === STOCK MÍNIMO ===
  {
    chaves: ["stock baixo", "estoque baixo", "stock minimo", "estoque minimo", "sem stock", "sem estoque", "acabou", "falta"],
    resposta: "Para ver peças com stock baixo:\n1. Vai a **Stock**\n2. As peças com stock igual ou abaixo do mínimo aparecem em destaque no topo da página (⚠️ Peças com stock baixo)."
  },
  // === CAIXA ===
  {
    chaves: ["caixa", "abrir caixa", "fechar caixa", "vender", "venda", "como vender", "pdv"],
    resposta: "Para usar o Caixa:\n1. Vai a **Caixa** (logo abaixo do Painel)\n2. Define um saldo inicial e clica em **Abrir Caixa**\n3. Seleciona produtos/serviços e adiciona ao carrinho\n4. Clica em **Finalizar Venda**\n5. Escolhe o método de pagamento.\n\nCada venda atualiza o stock e o financeiro automaticamente."
  },
  // === ENCOMENDAS ===
  {
    chaves: ["encomendar", "encomenda", "comprar", "fazer pedido", "pedido", "fornecedor"],
    resposta: "Para criar uma encomenda:\n1. Vai a **Encomendas**\n2. Clica em **Nova Encomenda**\n3. Escolhe o tipo (Oficina ou Cliente)\n4. Adiciona as peças do stock\n5. Define a data prevista e guarda."
  },
  // === CLIENTES ===
  {
    chaves: ["cliente", "clientes", "cadastrar cliente", "criar cliente", "novo cliente"],
    resposta: "Para gerir clientes:\n1. Vai a **Clientes**\n2. Clica em **+ Novo Cliente** para adicionar\n3. Preenche nome, NIF, telefone, etc.\n4. Clica em **Guardar**."
  },
  // === VEÍCULOS ===
  {
    chaves: ["veiculo", "veículo", "viatura", "cadastrar veiculo", "criar veiculo", "matricula"],
    resposta: "Para gerir veículos:\n1. Vai a **Veículos**\n2. Clica em **+ Novo Veículo**\n3. Preenche placa/matrícula, marca, modelo, etc.\n4. Associa a um cliente."
  },
  // === AGENDA ===
  {
    chaves: ["agenda", "agendar", "marcar", "calendario", "calendário", "marcação"],
    resposta: "Para usar a Agenda:\n1. Vai a **Agenda**\n2. Clica em **+ Novo Agendamento**\n3. Seleciona cliente, veículo, serviço e data/hora\n4. Clica em **Agendar**."
  },
  // === RELATÓRIOS ===
  {
    chaves: ["relatorio", "relatório", "exportar", "csv", "download"],
    resposta: "Para gerar relatórios:\n1. Vai a **Relatórios**\n2. Escolhe o tipo (Resumo, Ordens, Financeiro)\n3. Define o período (data início e fim)\n4. Clica em **Atualizar**\n5. Usa **Exportar** para guardar em CSV."
  },
  // === UTILIZADORES ===
  {
    chaves: ["usuario", "usuário", "utilizador", "criar usuario", "adicionar usuario", "funcionario", "colaborador", "senha", "password"],
    resposta: "Para gerir utilizadores:\n1. Vai a **Utilizadores**\n2. Clica em **+ Novo Utilizador**\n3. Preenche nome, email, senha e nível de acesso\n4. O utilizador será associado automaticamente à tua empresa."
  },
  // === CONFIGURAÇÕES ===
  {
    chaves: ["avatar", "foto perfil", "perfil", "configuracao", "configuração"],
    resposta: "Para alterar a foto de perfil:\n1. Vai a **Configurações**\n2. No separador **Meu Perfil**, clica no ícone da câmara\n3. Seleciona a foto do teu computador\n4. Clica em **Guardar Perfil**."
  },
  // === REDES SOCIAIS ===
  {
    chaves: ["facebook", "instagram", "tiktok", "rede social", "redes sociais"],
    resposta: "Para configurar as redes sociais da oficina:\n1. Vai a **Configurações > Dados da Oficina**\n2. Preenche os campos Facebook, Instagram, TikTok\n3. Clica em **Guardar**.\n\nEstas redes aparecem nas mensagens automáticas de WhatsApp e SMS."
  },
  // === ALUGUER ===
  {
    chaves: ["aluguer", "aluguel", "alugar", "rent", "alugar carro"],
    resposta: "Para gerir alugueres:\n1. Vai a **Alugueres**\n2. Clica em **Novo Aluguer**\n3. Seleciona cliente e veículo\n4. Define data de início e valor da diária\n5. Quando o veículo voltar, clica em **Finalizar** (cálculo automático do total)."
  },
  // === NÍVEIS DE ACESSO ===
  {
    chaves: ["super admin", "admin", "gerente", "tecnico", "tecnico", "recepcionista", "niveis", "níveis", "permissao", "permissão"],
    resposta: "Níveis de acesso do AutoTrack:\n• **SUPER_ADMIN** — dono da plataforma, acesso total\n• **ADMIN** — gere a sua oficina\n• **GERENTE** — gere operações (ordens, clientes, stock)\n• **TÉCNICO** — vê ordens e agenda\n• **RECEPCIONISTA** — atendimento e agendamentos"
  },
];

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
      return {
        resposta: item.resposta,
        precisaIA: false
      };
    }
  }
  
  // Se não encontrou nada, resposta genérica
  return {
    resposta: "Não encontrei informação específica sobre isso. 🤔\n\n**Tenta uma destas perguntas:**\n- \"Como criar uma ordem de serviço?\"\n- \"Como bater o ponto?\"\n- \"Como emitir uma fatura?\"\n- \"Como adicionar foto a uma peça?\"\n\nOu consulta o menu correspondente no sistema.",
    precisaIA: false
  };
}

// Adicionar ao array respostasDiretas (antes do fecho do array)
// === SAUDAÇÕES ===
{
  chaves: ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite", "boas", "e aí", "e ai", "iae", "salve", "opa", "hello", "hey", "bom dia", "boa tarde", "boa noite", "como vai", "tudo bem", "tudo bom"],
  resposta: "Olá! 😊 Em que posso ajudar? Podes perguntar sobre:\n- Como criar uma OS\n- Como bater o ponto\n- Como emitir uma fatura\n- Como adicionar foto a uma peça\n- Como funciona o caixa\n\nEstou aqui para ajudar!"
},
