"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  const [oficina, setOficina] = useState({
    nome: "", telefone: "", email: "", endereco: "", logo: "",
    latitude: "", longitude: "", raioPermitido: "", tipoOficina: "",
    moloniDevId: "", moloniSecret: "", moloniEmail: "", moloniPass: "", moloniCompanyId: "",
  });

  useEffect(() => {
    fetch("/api/configuracoes")
      .then(r => r.json())
      .then(d => {
        if (d.oficina) {
          setOficina(prev => ({
            ...prev,
            nome: d.oficina.nome || "",
            telefone: d.oficina.telefone || "",
            email: d.oficina.email || "",
            endereco: d.oficina.endereco || "",
            logo: d.oficina.logo || "",
            latitude: d.oficina.latitude || "",
            longitude: d.oficina.longitude || "",
            raioPermitido: d.oficina.raioPermitido?.toString() || "",
            tipoOficina: d.oficina.tipoOficina || "",
            moloniDevId: d.oficina.moloniDevId || "",
            moloniSecret: d.oficina.moloniSecret || "",
            moloniEmail: d.oficina.moloniEmail || "",
            moloniPass: d.oficina.moloniPass || "",
            moloniCompanyId: d.oficina.moloniCompanyId || "",
          }));
        }
      });
  }, []);

  const handleChange = (campo: string, valor: string) => {
    setOficina(prev => ({ ...prev, [campo]: valor }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) {
      setOficina(prev => ({ ...prev, logo: data.url }));
    }
  };

  const guardar = () => {
    fetch("/api/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oficina: {
          nome: oficina.nome,
          telefone: oficina.telefone,
          email: oficina.email,
          endereco: oficina.endereco,
          logo: oficina.logo,
          latitude: oficina.latitude,
          longitude: oficina.longitude,
          raioPermitido: oficina.raioPermitido,
          tipoOficina: oficina.tipoOficina,
          moloniDevId: oficina.moloniDevId,
          moloniSecret: oficina.moloniSecret,
          moloniEmail: oficina.moloniEmail,
          moloniPass: oficina.moloniPass,
          moloniCompanyId: oficina.moloniCompanyId,
        },
      }),
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
          <TabsTrigger value="addons">Addons</TabsTrigger>
        </TabsList>
        <TabsContent value="geral">
          <Card className="glass">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Nome da oficina" value={oficina.nome} onChange={e => handleChange("nome", e.target.value)} />
                <Input placeholder="NIF" value={oficina.email} onChange={e => handleChange("email", e.target.value)} />
                <Input placeholder="Morada" value={oficina.endereco} onChange={e => handleChange("endereco", e.target.value)} />
                <Input placeholder="Telefone" value={oficina.telefone} onChange={e => handleChange("telefone", e.target.value)} />
                <Input placeholder="Latitude" value={oficina.latitude} onChange={e => handleChange("latitude", e.target.value)} />
                <Input placeholder="Longitude" value={oficina.longitude} onChange={e => handleChange("longitude", e.target.value)} />
                <Input placeholder="Raio Permitido (m)" type="number" value={oficina.raioPermitido} onChange={e => handleChange("raioPermitido", e.target.value)} />
                <Input placeholder="Tipo de Oficina" value={oficina.tipoOficina} onChange={e => handleChange("tipoOficina", e.target.value)} />
                <Input placeholder="Moloni Dev ID" value={oficina.moloniDevId} onChange={e => handleChange("moloniDevId", e.target.value)} />
                <Input placeholder="Moloni Secret" value={oficina.moloniSecret} onChange={e => handleChange("moloniSecret", e.target.value)} />
                <Input placeholder="Moloni Email" value={oficina.moloniEmail} onChange={e => handleChange("moloniEmail", e.target.value)} />
                <Input placeholder="Moloni Password" type="password" value={oficina.moloniPass} onChange={e => handleChange("moloniPass", e.target.value)} />
                <Input placeholder="Moloni Company ID" value={oficina.moloniCompanyId} onChange={e => handleChange("moloniCompanyId", e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Logo da Oficina</label>
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                </div>
                {oficina.logo && (
                  <img src={oficina.logo} alt="Logo" className="h-12 rounded" />
                )}
              </div>
              <Button onClick={guardar}>Guardar</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="whatsapp"><Card className="glass"><CardContent className="p-6"><WhatsAppSection /></CardContent></Card></TabsContent>
        <TabsContent value="faturacao"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Configuração de faturação via Moloni.</p></CardContent></Card></TabsContent>
        <TabsContent value="notificacoes"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Gerir notificações.</p></CardContent></Card></TabsContent>
        <TabsContent value="seguranca"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Alterar password, 2FA.</p></CardContent></Card></TabsContent>
        <TabsContent value="addons"><Card className="glass"><CardContent className="p-6"><p className="text-gray-500">Módulos adicionais.</p></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
