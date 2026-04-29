import { prisma } from "./prisma";

export async function getCachedResposta(pergunta: string): Promise<string | null> {
  const cache = await prisma.chatCache.findUnique({ where: { pergunta } });
  return cache?.resposta ?? null;
}

export async function setCachedResposta(pergunta: string, resposta: string) {
  await prisma.chatCache.upsert({
    where: { pergunta },
    update: { resposta },
    create: { pergunta, resposta },
  });
}
