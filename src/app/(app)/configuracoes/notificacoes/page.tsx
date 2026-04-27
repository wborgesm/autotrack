"use client";
import { useState, useEffect } from "react";
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
    const res = await fetch("/api/testes/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefone: smsPhone, mensagem: smsMessage }) });
    const data = await res.json();
    setResult(res.ok ? "✅ SMS enviado!" : "❌ " + (data.error || "Erro"));
  };

  const sendWhatsApp = async () => {
    const res = await fetch("/api/whatsapp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: waPhone, message: waMessage }) });
    const data = await res.json();
    setResult(res.ok ? "✅ WhatsApp enviado!" : "❌ " + (data.error || "Erro"));
  };

  if (!session || session.user.nivel !== "SUPER_ADMIN") return <div className="p-6 text-gray-900 dark:text-white">Acesso restrito ao SUPER_ADMIN.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h1>
      <Tabs defaultValue="sms">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="sms"><Smartphone className="h-4 w-4 mr-2" /> SMS</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="sms">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader><CardTitle className="text-gray-900 dark:text-white">Enviar SMS</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-gray-700 dark:text-gray-300">Telefone</Label><Input className="bg-gray-100 dark:bg-gray-700" placeholder="+351..." value={smsPhone} onChange={e => setSmsPhone(e.target.value)} /></div>
              <div><Label className="text-gray-700 dark:text-gray-300">Mensagem</Label><Input className="bg-gray-100 dark:bg-gray-700" value={smsMessage} onChange={e => setSmsMessage(e.target.value)} /></div>
              <Button onClick={sendSms} className="bg-blue-600"><Send className="h-4 w-4 mr-2" /> Enviar SMS</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="whatsapp">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader><CardTitle className="text-gray-900 dark:text-white">Enviar WhatsApp</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-gray-700 dark:text-gray-300">Telefone</Label><Input className="bg-gray-100 dark:bg-gray-700" placeholder="351..." value={waPhone} onChange={e => setWaPhone(e.target.value)} /></div>
              <div><Label className="text-gray-700 dark:text-gray-300">Mensagem</Label><Input className="bg-gray-100 dark:bg-gray-700" value={waMessage} onChange={e => setWaMessage(e.target.value)} /></div>
              <Button onClick={sendWhatsApp} className="bg-green-600"><Send className="h-4 w-4 mr-2" /> Enviar WhatsApp</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {result && <Badge className={result.startsWith("✅") ? "bg-green-600" : "bg-red-600"}>{result}</Badge>}
    </div>
  );
}
