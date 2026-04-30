"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    fetch("/api/configuracoes")
      .then(r => r.json())
      .then(d => {
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
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!podeEditar) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) setOficina((prev: any) => ({ ...prev, logo: data.url }));
  };

    setCores((prev: any) => ({ ...prev, [campo]: valor }));
    document.documentElement.style.setProperty(`--color-${campo === "corPrimaria" ? "primary" : "secondary"}`, valor);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!podeEditar) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) setOficina((prev: any) => ({ ...prev, logo: data.url }));
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="aparencia">Aparência</TabsTrigger>}
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="faturacao">Faturação</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="addons">Módulos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card className="glass">
            <CardHeader><CardTitle>Dados da Oficina</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Nome da oficina" value={oficina.nome || ""} onChange={e => handleChange("nome", e.target.value)} disabled={!podeEditar} className="bg-white dark:bg-gray-800" />
                <Input placeholder="Email" value={oficina.email || ""} onChange={e => handleChange("email", e.target.value)} disabled={!podeEditar} className="bg-white dark:bg-gray-800" />
                <Input placeholder="Morada" value={oficina.endereco || ""} onChange={e => handleChange("endereco", e.target.value)} disabled={!podeEditar} className="bg-white dark:bg-gray-800" />
                <Input placeholder="Telefone" value={oficina.telefone || ""} onChange={e => handleChange("telefone", e.target.value)} disabled={!podeEditar} className="bg-white dark:bg-gray-800" />
                <Input placeholder="Latitude" value={oficina.latitude || ""} onChange={e => handleChange("latitude", e.target.value)} disabled={!podeEditar} className="bg-white dark:bg-gray-800" />
                <Input placeholder="Longitude" value={oficina.longitude || ""} onChange={e => handleChange("longitude", e.target.value)} disabled={!podeEditar} className="bg-white dark:bg-gray-800" />
                <Input placeholder="Raio Permitido (m)" type="number" value={oficina.raioPermitido || ""} onChange={e => handleChange("raioPermitido", e.target.value)} disabled={!podeEditar} className="bg-white dark:bg-gray-800" />
                <Input placeholder="Tipo de Oficina" value={oficina.tipoOficina || ""} onChange={e => handleChange("tipoOficina", e.target.value)} disabled={!podeEditar} className="bg-white dark:bg-gray-800" />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Logo da Oficina</label>
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                </div>
                {oficina.logo && <img src={oficina.logo} alt="Logo" className="h-12 rounded" />}
              </div>
              {podeEditar && <Button onClick={guardar}>Guardar</Button>}
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="aparencia">
            <Card className="glass">
              <CardHeader><CardTitle>Personalizar Aparência</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cor Primária</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cores.corPrimaria}
                        onChange={e => handleCorChange("corPrimaria", e.target.value)}
                        className="h-10 w-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={cores.corPrimaria}
                        onChange={e => handleCorChange("corPrimaria", e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-800"
                        disabled={!podeEditar}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cor Secundária</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cores.corSecundaria}
                        onChange={e => handleCorChange("corSecundaria", e.target.value)}
                        className="h-10 w-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={cores.corSecundaria}
                        onChange={e => handleCorChange("corSecundaria", e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-800"
                        disabled={!podeEditar}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg text-white font-medium" style={{ backgroundColor: cores.corPrimaria }}>
                  Pré-visualização: Cor Primária
                </div>
                <div className="p-4 border rounded-lg text-white font-medium" style={{ backgroundColor: cores.corSecundaria }}>
                  Pré-visualização: Cor Secundária
                </div>
                {podeEditar && <Button onClick={guardar} className="bg-blue-600">Salvar Aparência</Button>}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="whatsapp"><Card className="glass"><CardContent className="p-6"><WhatsAppSection /></CardContent></Card></TabsContent>
        <TabsContent value="faturacao"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Configuração de faturação via Moloni.</p></CardContent></Card></TabsContent>
        <TabsContent value="notificacoes"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Gerir notificações.</p></CardContent></Card></TabsContent>
        <TabsContent value="seguranca"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Alterar password, 2FA.</p></CardContent></Card></TabsContent>
        <TabsContent value="addons"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Módulos adicionais.</p></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
