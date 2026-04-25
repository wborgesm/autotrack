/**
 * Envia SMS através do Traccar SMS Gateway (telemóvel Android na rede local).
 *
 * Pré‑requisitos:
 * - Ter a app Traccar SMS Gateway instalada e o serviço local ativo.
 * - Configurar SMS_GATEWAY_URL e SMS_GATEWAY_TOKEN no .env
 */

const BASE_URL = process.env.SMS_GATEWAY_URL || "http://localhost:8082";
const TOKEN = process.env.SMS_GATEWAY_TOKEN || "";

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function enviarSMS(telefone: string, mensagem: string): Promise<SmsResult> {
  if (!TOKEN) {
    console.error("SMS_GATEWAY_TOKEN não configurado.");
    return { success: false, error: "Token em falta" };
  }

  // Garantir que o número está em formato internacional (ex: +351...)
  const numeroFormatado = telefone.startsWith("+") ? telefone : `+351${telefone.replace(/^0+/, "")}`;

  try {
    const res = await fetch(`${BASE_URL}/`, {
      method: "POST",
      headers: {
        "Authorization": TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: numeroFormatado,
        message: mensagem,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Erro ao enviar SMS:", res.status, body);
      return { success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, messageId: data.id || data.messageId };
  } catch (error) {
    console.error("Falha de rede ao enviar SMS:", error);
    return { success: false, error: "Erro de rede" };
  }
}

/**
 * Dispara notificação de alteração de estado de uma OS.
 */
export async function notificarMudancaEstadoOS(
  telefoneCliente: string,
  nomeCliente: string,
  status: string,
  numeroOS: number
): Promise<SmsResult> {
  const mensagens: Record<string, string> = {
    PRONTA: `AutoTrack: ${nomeCliente}, a sua viatura da OS #${numeroOS} está pronta para levantamento.`,
    ENTREGUE: `AutoTrack: ${nomeCliente}, a OS #${numeroOS} foi entregue. Obrigado pela confiança!`,
    ABERTA: `AutoTrack: ${nomeCliente}, a sua OS #${numeroOS} foi aberta. Entraremos em contacto brevemente.`,
  };

  const mensagem = mensagens[status] || `AutoTrack: ${nomeCliente}, a sua OS #${numeroOS} mudou para o estado "${status}".`;

  return enviarSMS(telefoneCliente, mensagem);
}
