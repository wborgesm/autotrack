import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { enviarSMS } from "@/lib/sms-gateway";

interface Mensagem {
  id: string;
  tipo: "whatsapp" | "sms";
  telefone: string;
  mensagem: string;
  criadaEm: string;
  tentativas: number;
}

let fila: Mensagem[] = [];

export function adicionarFila(tipo: "whatsapp" | "sms", telefone: string, mensagem: string) {
  fila.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tipo,
    telefone,
    mensagem,
    criadaEm: new Date().toISOString(),
    tentativas: 0,
  });
  console.log(`📨 Adicionado à fila: ${tipo} para ${telefone}`);
  processarFila();
}

export async function processarFila() {
  if (fila.length === 0) return;
  console.log(`🔄 Processando fila de ${fila.length} mensagens...`);

  const pendentes = [...fila];
  fila = [];

  for (const msg of pendentes) {
    try {
      if (msg.tipo === "whatsapp") {
        const result = await sendWhatsAppMessage(msg.telefone, msg.mensagem);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await enviarSMS(msg.telefone, msg.mensagem);
        if (!result.success) throw new Error(result.error);
      }
      console.log(`✅ Mensagem ${msg.id} enviada com sucesso`);
    } catch (error) {
      if (msg.tentativas < 3) {
        msg.tentativas++;
        fila.push(msg);
        console.log(`⏳ Mensagem ${msg.id} re-agendada (tentativa ${msg.tentativas})`);
      } else {
        console.error(`❌ Mensagem ${msg.id} descartada após 3 tentativas`);
      }
    }
  }
}

setInterval(processarFila, 60000);
