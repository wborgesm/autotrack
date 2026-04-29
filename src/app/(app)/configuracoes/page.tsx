"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const podeEditar = session?.user?.nivel ? ["SUPER_ADMIN","ADMIN","GERENTE"].includes(session.user.nivel) : false;
  const isSuperAdmin = session?.user?.nivel === "SUPER_ADMIN";

  const [oficina, setOficina] = useState<any>({});
  const [cores, setCores] = useState({ corPrimaria: "#3b82f6", corSecundaria: "#1e40af" });

  useEffect(() => {
    fetch("/api/configuracoes").then(r => r.json()).then(d => {
      if (d.oficina) {
        setOficina(d.oficina);
        setCores({
          corPrimaria: d.oficina.corPrimaria || "#3b82f6",
          corSecundaria: d.oficina.corSecundaria || "#1e40af",
        });
      }
    });
  }, []);

  const handleChange = (campo: string, valor: string) => {
    if (!podeEditar) return;
    setOficina((prev: any) => ({ ...prev, [campo]: valor }));
  };

  const handleCorChange = (campo: string, valor: string) => {
    setCores((prev: any) => ({ ...prev, [campo]: valor }));
    // Aplica imediatamente ao html
    document.documentElement.style.setProperty(`--color-${campo === "corPrimaria" ? "primary" : "secondary"}`, valor);
  };

  const guardar = () => {
    if (!podeEditar) return;
    fetch("/api/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oficina: { ...oficina, ...cores } }),
    }).then(() => alert("Configurações guardadas."));
  };

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
          {isSuperAdmin && <TabsTrigger value="aparencia">Aparência</TabsTrigger>}
          <TabsTrigger value="addons">Addons</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">{/* ... mesma aba Geral ... */}</TabsContent>
        <TabsContent value="whatsapp"><Card className="glass"><CardContent className="p-6"><WhatsAppSection /></CardContent></Card></TabsContent>
        <TabsContent value="faturacao"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Configuração de faturação via Moloni.</p></CardContent></Card></TabsContent>
        <TabsContent value="notificacoes">{/* ... mesma aba Notificações ... */}</TabsContent>
        <TabsContent value="seguranca">{/* ... mesma aba Segurança ... */}</TabsContent>

        {isSuperAdmin && (
          <TabsContent value="aparencia">
            <Card className="glass">
              <CardContent className="p-6 space-y-6">
                <h3 className="font-semibold text-lg">Personalizar Aparência</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Cor Primária</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={cores.corPrimaria}
                        onChange={e => handleCorChange("corPrimaria", e.target.value)}
                        className="h-10 w-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={cores.corPrimaria}
                        onChange={e => handleCorChange("corPrimaria", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cor Secundária</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={cores.corSecundaria}
                        onChange={e => handleCorChange("corSecundaria", e.target.value)}
                        className="h-10 w-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={cores.corSecundaria}
                        onChange={e => handleCorChange("corSecundaria", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg" style={{ backgroundColor: cores.corPrimaria, color: "white" }}>
                  Pré-visualização: Cor Primária
                </div>
                <div className="p-4 border rounded-lg" style={{ backgroundColor: cores.corSecundaria, color: "white" }}>
                  Pré-visualização: Cor Secundária
                </div>
                <Button onClick={guardar}>Salvar Aparência</Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="addons">{/* ... mesma aba Addons ... */}</TabsContent>
      </Tabs>
    </div>
  );
}
