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

export async function notificarMudancaEstadoOS(
  telefoneCliente: string,
  nomeCliente: string,
  status: string,
  numeroOS: number,
  oficinaNome: string = "AutoTrack"
): Promise<SmsResult> {
  const mensagens: Record<string, string> = {
    PRONTA: `${oficinaNome}: ${nomeCliente}, a sua viatura da OS #${numeroOS} está pronta para levantamento.`,
    ENTREGUE: `${oficinaNome}: ${nomeCliente}, a OS #${numeroOS} foi entregue. Obrigado pela confiança!`,
    ABERTA: `${oficinaNome}: ${nomeCliente}, a sua OS #${numeroOS} foi aberta. Entraremos em contacto brevemente.`,
  };

  const mensagem = mensagens[status] || `${oficinaNome}: ${nomeCliente}, a sua OS #${numeroOS} mudou para o estado "${status}".`;

  return enviarSMS(telefoneCliente, mensagem);
}
