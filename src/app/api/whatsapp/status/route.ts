import { NextResponse } from "next/server";
import { getConnectionState, getQRCode, initWhatsApp } from "@/lib/whatsapp/client";

export async function GET() {
  try {
    await initWhatsApp();
    const state = getConnectionState();
    const qrCode = getQRCode();
    return NextResponse.json({ state, qrCode });
  } catch (error) {
    console.error("Erro ao obter status do WhatsApp:", error);
    return NextResponse.json({ state: "DISCONNECTED", qrCode: null });
  }
}
