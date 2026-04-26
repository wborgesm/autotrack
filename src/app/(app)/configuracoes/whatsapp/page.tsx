"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

export default function WhatsAppConfigPage() {
  const [state, setState] = useState("DISCONNECTED");
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setState(data.state);
      setQrCode(data.qrCode);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configuração do WhatsApp</h1>
      <Card>
        <CardHeader>
          <CardTitle>Estado: {state === "CONNECTED" ? "🟢 Conectado" : state === "QR_READY" ? "🟡 Aguardando QR Code" : "🔴 Desconectado"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {state === "QR_READY" && qrCode && (
            <QRCodeSVG value={qrCode} size={256} />
          )}
          {state === "CONNECTED" && (
            <p className="text-green-600 font-medium">WhatsApp conectado e pronto a usar!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
