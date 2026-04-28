// Frases humanizadas para o chatbot (PT-PT e PT-BR)

export const saudacoes = [
  "Olá! 😊 Em que posso ajudar hoje?",
  "Boas! Precisa de ajuda com alguma coisa?",
  "Bem-vindo! Estou aqui para ajudar.",
  "Olá! Como posso ajudar?",
  "Oi! Tudo bem? Em que posso te ajudar?",
];

export const processando = [
  "Um momento, por favor... ⏳",
  "A tratar disso...",
  "Já estou a verificar...",
  "Só um instante...",
];

export const confirmacoes = [
  "Perfeito! 👍",
  "Já está resolvido.",
  "Concluído com sucesso.",
  "Tudo certo!",
];

export const erros = [
  "Ocorreu um erro, mas já pode tentar novamente 👍",
  "Algo correu mal. Vamos tentar outra vez?",
  "Não consegui concluir, mas posso ajudar a resolver.",
];

export const naoEntendi = [
  "Não percebi bem 😅 Pode reformular?",
  "Pode explicar de outra forma?",
  "Quer dizer... está a tentar fazer o quê exatamente?",
];

export const sugestoes = [
  "Quer criar uma ordem de serviço?",
  "Posso ajudar com uma encomenda.",
  "Precisa ver o stock?",
  "Quer consultar um cliente?",
  "Precisa de ajuda com alguma OS?",
];

export const finalizacao = [
  "Precisa de mais alguma coisa?",
  "Posso ajudar em mais algo?",
  "Se precisar, estou por aqui 👍",
];

export function aleatorio(lista: string[]): string {
  return lista[Math.floor(Math.random() * lista.length)];
}
