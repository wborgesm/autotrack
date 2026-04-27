"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw } from "lucide-react";

export default function WhatsAppConfigPage() {
  const [state, setState] = useState("DISCONNECTED");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/whatsapp/status")
      .then(r => r.json())
      .then(data => {
        setState(data.state || data.status || "DISCONNECTED");
        setQrCode(data.qrCode || null);
      })
      .catch(() => setState("DISCONNECTED"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStatus(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp</h1>
        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Estado da Ligação: {" "}
            {state === "CONNECTED" ? "🟢 Conectado" : state === "QR_READY" ? "🟡 Aguardando leitura" : "🔴 Desconectado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {state === "QR_READY" && qrCode && (
            <div className="p-4 bg-white rounded-lg shadow-inner">
              <QRCodeSVG value={qrCode} size={256} />
              <p className="text-sm text-gray-500 mt-2 text-center">Escaneie com o WhatsApp do telemóvel</p>
            </div>
          )}
          {state === "CONNECTED" && (
            <p className="text-green-600 font-medium">Tudo pronto! As mensagens serão enviadas automaticamente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
