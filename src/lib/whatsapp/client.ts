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

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: "/var/www/html/autotrack/.wwebjs_auth",
    }),
    puppeteer: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
      headless: true,
    },
  });

  client.on("qr", (qr: string) => {
    console.log("🟡 WhatsApp QR Code recebido");
    qrCodeBase64 = qr;
    connectionState = "QR_READY";
  });

  client.on("ready", () => {
    console.log("🟢 WhatsApp conectado com sucesso!");
    qrCodeBase64 = null;
    connectionState = "CONNECTED";
  });

  client.on("disconnected", () => {
    console.log("🔴 WhatsApp desconectado");
    qrCodeBase64 = null;
    connectionState = "DISCONNECTED";
    client = null;
    setTimeout(() => initWhatsApp(), 5000);
  });

  await client.initialize();
  return client;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cl = getClient() || await initWhatsApp();
    if (connectionState !== "CONNECTED") {
      throw new Error("WhatsApp não está conectado");
    }

    const normalizedPhone = phone.replace(/\D/g, "");
    const chatId = `${normalizedPhone}@c.us`;

    await cl.sendMessage(chatId, message);
    console.log(`✅ Mensagem enviada para ${phone}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    return { success: false, error: "Falha ao enviar mensagem" };
  }
}

// Iniciar o cliente automaticamente ao carregar o módulo
initWhatsApp().catch(console.error);
