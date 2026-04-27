import { Client, LocalAuth } from "whatsapp-web.js";

let client: Client | null = null;
let qrCodeBase64: string | null = null;
let connectionState: "DISCONNECTED" | "QR_READY" | "CONNECTED" = "DISCONNECTED";

export function getQRCode(): string | null {
  return qrCodeBase64;
}

export function getConnectionState(): string {
  return connectionState;
}

export function getClient(): Client | null {
  return client;
}

export async function initWhatsApp(): Promise<Client> {
  if (client) return client;
  console.log("🔄 Iniciando WhatsApp...");

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: "/var/www/html/autotrack/.wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", (qr: string) => {
    console.log("🟡 WhatsApp: QR Code recebido");
    qrCodeBase64 = qr;
    connectionState = "QR_READY";
  });

  client.on("ready", () => {
    console.log("🟢 WhatsApp: Conectado com sucesso!");
    qrCodeBase64 = null;
    connectionState = "CONNECTED";
  });

  client.on("disconnected", () => {
    console.log("🔴 WhatsApp: Desconectado");
    qrCodeBase64 = null;
    connectionState = "DISCONNECTED";
    client = null;
    setTimeout(() => initWhatsApp(), 10000);
  });

  try {
    await client.initialize();
    return client;
  } catch (error) {
    console.error("❌ Erro ao inicializar WhatsApp:", error);
    client = null;
    connectionState = "DISCONNECTED";
    throw error;
  }
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cl = client || await initWhatsApp();
    if (connectionState !== "CONNECTED") {
      throw new Error("WhatsApp não está conectado");
    }
    const normalizedPhone = phone.replace(/\D/g, "");
    const chatId = `${normalizedPhone}@c.us`;
    await cl.sendMessage(chatId, message);
    console.log(`✅ WhatsApp: Mensagem enviada para ${phone}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Erro ao enviar WhatsApp:", error.message);
    return { success: false, error: error.message || "Falha ao enviar mensagem" };
  }
}

// Inicializa o cliente ao carregar o módulo
initWhatsApp().catch(console.error);
