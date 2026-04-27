import { Client, LocalAuth } from "whatsapp-web.js";

let client: Client | null = null;
let qrCodeData: string | null = null;
let connectionState: "DISCONNECTED" | "QR_READY" | "CONNECTED" = "DISCONNECTED";

export function getQRCode(): string | null {
  return qrCodeData;
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
        "--disable-gpu",
        "--single-process",
      ],
      headless: true,
    },
  });

  client.on("qr", (qr: string) => {
    console.log("🟡 WhatsApp QR Code recebido");
    qrCodeData = qr;                    // guarda o novo QR
    connectionState = "QR_READY";       // mantém o estado QR enquanto não conectar
  });

  client.on("ready", () => {
    console.log("🟢 WhatsApp conectado com sucesso!");
    qrCodeData = null;                  // só apaga o QR quando a conexão é bem‑sucedida
    connectionState = "CONNECTED";
  });

  client.on("disconnected", () => {
    console.log("🔴 WhatsApp desconectado");
    // NÃO apaga o QR Code antigo – a página pode continuar a mostrá‑lo
    connectionState = "DISCONNECTED";
    client = null;
    setTimeout(() => initWhatsApp(), 10000);
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
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao enviar WhatsApp:", error);
    return { success: false, error: error.message || "Falha ao enviar mensagem" };
  }
}

// Iniciar o cliente automaticamente
initWhatsApp().catch(console.error);
