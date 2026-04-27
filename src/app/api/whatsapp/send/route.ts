import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { sendCloudMessage, isCloudAPIAvailable } from "@/lib/whatsapp-cloud";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { phone, message } = await req.json();
  if (!phone || !message) {
    return NextResponse.json({ error: "Telefone e mensagem são obrigatórios" }, { status: 400 });
  }

  let result;

  // Tenta Cloud API primeiro (se configurada)
  if (isCloudAPIAvailable()) {
    result = await sendCloudMessage(phone, message);
  } else {
    // Fallback para whatsapp-web.js
    result = await sendWhatsAppMessage(phone, message);
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, messageId: (result as any).messageId });
}
