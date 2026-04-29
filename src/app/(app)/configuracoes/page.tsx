"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

function WhatsAppSection() {
  const [status, setStatus] = useState("DISCONNECTED");
  const [qrCode, setQrCode] = useState<string | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/whatsapp/status").then(r => r.json()).then(d => {
        setStatus(d.status); setQrCode(d.qrCodeBase64 || null);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="space-y-4 text-center">
      {status === "DISCONNECTED" && <p className="text-gray-500">Desconectado</p>}
      {status === "QR_READY" && qrCode && <img src={qrCode} alt="QR Code" className="mx-auto" />}
      {status === "CONNECTED" && <p className="text-green-600 font-semibold">Conectado</p>}
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="faturacao">Faturação</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="addons">Addons</TabsTrigger>
        </TabsList>
        <TabsContent value="geral"><Card className="glass"><CardContent className="p-6 grid grid-cols-2 gap-4"><Input placeholder="Nome da oficina" /><Input placeholder="NIF" /><Input placeholder="Morada" /><Input placeholder="Telefone" /><Button>Guardar</Button></CardContent></Card></TabsContent>
        <TabsContent value="whatsapp"><Card className="glass"><CardContent className="p-6"><WhatsAppSection /></CardContent></Card></TabsContent>
        <TabsContent value="faturacao"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Configuração de faturação via Moloni.</p></CardContent></Card></TabsContent>
        <TabsContent value="notificacoes"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Gerir notificações.</p></CardContent></Card></TabsContent>
        <TabsContent value="seguranca"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Alterar password, 2FA.</p></CardContent></Card></TabsContent>
        <TabsContent value="addons"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Módulos adicionais.</p></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
