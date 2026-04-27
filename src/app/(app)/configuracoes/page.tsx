"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Store, Smartphone, Star, MapPin, MessageCircle, Globe, Clock, Bell } from "lucide-react";

export default function ConfiguracoesPage() {
  const { data: session, update } = useSession();
  const [perfil, setPerfil] = useState({ nome: "", email: "", avatar: "" });
  const [oficina, setOficina] = useState<any>({});
  const [addons, setAddons] = useState<any>({});

  const nivel = session?.user?.nivel || "";
  const podeEditarOficina = nivel === "ADMIN" || nivel === "SUPER_ADMIN";
  const podeEditarAddons = nivel === "SUPER_ADMIN";

  useEffect(() => {
    if (!session) return;
    setPerfil({ nome: session.user.name || "", email: session.user.email || "", avatar: session.user.avatar || "" });
    fetch("/api/configuracoes")
      .then(r => r.json())
      .then(d => { setOficina(d.oficina || {}); setAddons(d.addons || {}); })
      .catch(() => {});
  }, [session]);

  const handleSaveOficina = async () => {
    const res = await fetch("/api/configuracoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oficina }) });
    if (res.ok) alert("Dados guardados.");
    else alert("Erro ao guardar.");
  };

  const handleSaveAddons = async () => {
    const res = await fetch("/api/configuracoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addons }) });
    if (res.ok) alert("Addons atualizados.");
    else alert("Erro ao guardar.");
  };

  const handleSavePerfil = async () => {
    await fetch("/api/usuario/avatar", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: perfil.nome, avatar: perfil.avatar }) });
    update();
    alert("Perfil atualizado.");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Tabs defaultValue="perfil">
        <TabsList className="bg-gray-100 dark:bg-gray-800 flex flex-wrap">
          <TabsTrigger value="perfil"><User className="h-4 w-4 mr-2" /> Meu Perfil</TabsTrigger>
          <TabsTrigger value="oficina"><Store className="h-4 w-4 mr-2" /> Dados da Oficina</TabsTrigger>
          <TabsTrigger value="addons"><Smartphone className="h-4 w-4 mr-2" /> Módulos Adicionais</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card><CardHeader><CardTitle>Meu Perfil</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><Label>Nome</Label><Input className="bg-gray-100 dark:bg-gray-700" value={perfil.nome} onChange={e => setPerfil({...perfil, nome: e.target.value})} /></div>
            <div><Label>Email</Label><Input className="bg-gray-100 dark:bg-gray-700" value={perfil.email} disabled /></div>
            <div><Label>Avatar (URL)</Label><Input className="bg-gray-100 dark:bg-gray-700" value={perfil.avatar} onChange={e => setPerfil({...perfil, avatar: e.target.value})} /></div>
            <Button onClick={handleSavePerfil} className="bg-blue-600">Guardar</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="oficina">
          <Card><CardHeader><CardTitle>Dados da Oficina</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.nome || ""} onChange={e => setOficina({...oficina, nome: e.target.value})} disabled={!podeEditarOficina} /></div>
              <div><Label>Telefone</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.telefone || ""} onChange={e => setOficina({...oficina, telefone: e.target.value})} disabled={!podeEditarOficina} /></div>
              <div><Label>Email</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.email || ""} onChange={e => setOficina({...oficina, email: e.target.value})} disabled={!podeEditarOficina} /></div>
              <div><Label>Morada</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.endereco || ""} onChange={e => setOficina({...oficina, endereco: e.target.value})} disabled={!podeEditarOficina} /></div>
            </div>
            {podeEditarOficina && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo de Oficina</Label>
                    <Select value={oficina.tipoOficina || "AMBOS"} onValueChange={v => setOficina({...oficina, tipoOficina: v})} disabled={!podeEditarOficina}>
                      <SelectTrigger className="bg-gray-100 dark:bg-gray-700"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="CARROS">🚗 Carros</SelectItem><SelectItem value="MOTOS">🏍️ Motos</SelectItem><SelectItem value="AMBOS">🚗🏍️ Ambos</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="border-t pt-4"><p className="font-semibold mb-2">📍 Localização para Ponto</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Latitude</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.latitude || ""} onChange={e => setOficina({...oficina, latitude: e.target.value})} disabled={!podeEditarOficina} /></div>
                    <div><Label>Longitude</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.longitude || ""} onChange={e => setOficina({...oficina, longitude: e.target.value})} disabled={!podeEditarOficina} /></div>
                    <div><Label>Raio (m)</Label><Input className="bg-gray-100 dark:bg-gray-700" type="number" value={oficina.raioPermitido || "100"} onChange={e => setOficina({...oficina, raioPermitido: e.target.value})} disabled={!podeEditarOficina} /></div>
                  </div>
                </div>
                <Button onClick={handleSaveOficina} className="bg-blue-600">Guardar</Button>
              </>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="addons">
          <Card><CardHeader><CardTitle>Módulos Adicionais</CardTitle></CardHeader><CardContent className="space-y-4">
            {[
              { key: "ponto", icon: Clock, color: "text-blue-500", label: "Ponto Eletrónico", desc: "Registo de entrada/saída dos funcionários" },
              { key: "whatsapp", icon: MessageCircle, color: "text-green-500", label: "WhatsApp", desc: "Notificações via WhatsApp" },
              { key: "sms", icon: Bell, color: "text-yellow-500", label: "SMS", desc: "Notificações via SMS" },
              { key: "gps", icon: MapPin, color: "text-blue-500", label: "GPS Autotrack", desc: "Rastreamento de veículos em tempo real" },
              { key: "pontos", icon: Star, color: "text-yellow-500", label: "Programa de Fidelidade", desc: "Recompensas para clientes" },
              { key: "portal", icon: Globe, color: "text-purple-500", label: "Portal do Cliente", desc: "Acesso para clientes acompanharem as OS" }
            ].map(a => (
              <div key={a.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3"><a.icon className={`h-6 w-6 ${a.color}`} /><div><p className="font-medium">{a.label}</p><p className="text-sm text-gray-500">{a.desc}</p></div></div>
                <Switch
                  checked={addons[a.key] || false}
                  onCheckedChange={podeEditarAddons ? (v: boolean) => setAddons({...addons, [a.key]: v}) : undefined}
                  disabled={!podeEditarAddons}
                  className={!podeEditarAddons ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>
            ))}
            {podeEditarAddons && <Button onClick={handleSaveAddons} className="bg-blue-600 mt-4">Guardar Configurações</Button>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
