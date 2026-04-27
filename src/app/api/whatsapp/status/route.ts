import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConnectionState, getQRCode, initWhatsApp } from "@/lib/whatsapp/client";
import { isCloudAPIAvailable } from "@/lib/whatsapp-cloud";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
  }

  // Se Cloud API estiver configurada, devolve info da Cloud
  if (isCloudAPIAvailable()) {
    return NextResponse.json({
      mode: "cloud",
      state: "CONNECTED", // Cloud API está sempre "conectada" se configurada
      cloudAvailable: true,
      qrCode: null,
    });
  }

  // Caso contrário, usa whatsapp-web.js
  try {
    await initWhatsApp();
    const state = getConnectionState();
    const qrCode = getQRCode();
    return NextResponse.json({ mode: "webjs", state, qrCode, cloudAvailable: false });
  } catch (error) {
    console.error("Erro ao obter status do WhatsApp:", error);
    return NextResponse.json({ mode: "webjs", state: "DISCONNECTED", qrCode: null, cloudAvailable: false });
  }
}
