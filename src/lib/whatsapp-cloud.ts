/**
 * WhatsApp Cloud API (Meta Oficial)
 * 
 * Ativado automaticamente quando as variáveis WHATSAPP_CLOUD_PHONE_NUMBER_ID
 * e WHATSAPP_CLOUD_ACCESS_TOKEN estão configuradas no .env
 */

const PHONE_NUMBER_ID = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`;

export function isCloudAPIAvailable(): boolean {
  return !!(PHONE_NUMBER_ID && ACCESS_TOKEN);
}

export async function sendCloudMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!isCloudAPIAvailable()) {
    return { success: false, error: "Cloud API não configurada" };
  }

  try {
    const normalizedPhone = phone.replace(/\D/g, "");
    
    const res = await fetch(`${BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cloud API error:", data);
      return { success: false, error: data.error?.message || "Erro desconhecido" };
    }

    console.log(`✅ Cloud API: Mensagem enviada para ${phone}`);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error: any) {
    console.error("Cloud API: Erro de rede", error);
    return { success: false, error: error.message };
  }
}
