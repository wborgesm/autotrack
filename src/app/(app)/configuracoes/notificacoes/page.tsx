"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, Smartphone, MessageCircle } from "lucide-react";

export default function NotificacoesPage() {
  const { data: session } = useSession();
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [result, setResult] = useState("");

  const sendSms = async () => {
    const res = await fetch("/api/testes/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone: smsPhone, mensagem: smsMessage }),
    });
    const data = await res.json();
    setResult(res.ok ? "✅ SMS enviado!" : "❌ " + (data.error || "Erro"));
  };

  const sendWhatsApp = async () => {
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: waPhone, message: waMessage }),
    });
    const data = await res.json();
    setResult(res.ok ? "✅ WhatsApp enviado!" : "❌ " + (data.error || "Erro"));
  };

  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return <div className="p-6">Acesso restrito ao SUPER_ADMIN.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configurações de Notificações</h1>
      <Tabs defaultValue="sms">
        <TabsList>
          <TabsTrigger value="sms"><Smartphone className="h-4 w-4 mr-2" /> SMS</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="sms">
          <Card>
            <CardHeader><CardTitle>Enviar SMS (Teste)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Telefone</Label><Input placeholder="+351..." value={smsPhone} onChange={e => setSmsPhone(e.target.value)} /></div>
              <div><Label>Mensagem</Label><Input value={smsMessage} onChange={e => setSmsMessage(e.target.value)} /></div>
              <Button onClick={sendSms}><Send className="h-4 w-4 mr-2" /> Enviar SMS</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader><CardTitle>Enviar WhatsApp (Teste)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Telefone</Label><Input placeholder="+351..." value={waPhone} onChange={e => setWaPhone(e.target.value)} /></div>
              <div><Label>Mensagem</Label><Input value={waMessage} onChange={e => setWaMessage(e.target.value)} /></div>
              <Button onClick={sendWhatsApp}><Send className="h-4 w-4 mr-2" /> Enviar WhatsApp</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {result && <Badge className={result.startsWith("✅") ? "bg-green-600" : "bg-red-600"}>{result}</Badge>}
    </div>
  );
}
