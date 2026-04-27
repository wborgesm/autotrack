"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function WhatsAppConfigPage() {
  const { data: session } = useSession();
  const [state, setState] = useState("DISCONNECTED");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [modo, setModo] = useState<"cloud" | "webjs" | "none">("none");
  const [loading, setLoading] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/whatsapp/status")
      .then(r => r.json())
      .then(data => {
        setState(data.state || data.status || "DISCONNECTED");
        setQrCode(data.qrCode || null);
        setModo(data.mode || (data.cloudAvailable ? "cloud" : data.state ? "webjs" : "none"));
      })
      .catch(() => setState("DISCONNECTED"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStatus(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return <div className="p-6 text-gray-900 dark:text-white">Acesso restrito ao SUPER_ADMIN.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuração do WhatsApp</h1>

      {/* Modo Cloud API */}
      {modo === "cloud" && (
        <Card className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              WhatsApp Cloud API (Oficial)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 dark:text-green-400">A integração oficial da Meta está ativa. As mensagens serão enviadas pela Cloud API.</p>
            <p className="text-sm text-green-500 mt-2">Estado: {state}</p>
          </CardContent>
        </Card>
      )}

      {/* Modo WhatsApp Web (QR Code) */}
      {modo === "webjs" && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
              WhatsApp Web (whatsapp-web.js)
              <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Estado: {state === "CONNECTED" ? "🟢 Conectado" : state === "QR_READY" ? "🟡 Aguardando leitura" : "🔴 Desconectado"}
            </p>
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
      )}

      {/* Nenhum modo ativo */}
      {modo === "none" && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="h-5 w-5" />
              Nenhuma integração ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-400">
              Configure as variáveis WHATSAPP_CLOUD_PHONE_NUMBER_ID e WHATSAPP_CLOUD_ACCESS_TOKEN no .env para ativar a Cloud API oficial,
              ou mantenha as variáveis vazias para usar o whatsapp-web.js (QR Code).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
