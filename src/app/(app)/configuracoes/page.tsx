"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Store, Smartphone, Star, MapPin, MessageCircle, Globe, Clock, Bell } from "lucide-react";

export default function ConfiguracoesPage() {
  const { data: session, update } = useSession();
  const [perfil, setPerfil] = useState({ nome: "", email: "", avatar: "" });
  const [oficina, setOficina] = useState({ nome: "", telefone: "", email: "", endereco: "", logo: "", latitude: "", longitude: "", raioPermitido: "100" });
  const [addons, setAddons] = useState({ gps: false, pontos: false, whatsapp: false, portal: false, sms: false, ponto: false });

  useEffect(() => {
    if (!session) return;
    setPerfil({ nome: session.user.name || "", email: session.user.email || "", avatar: session.user.avatar || "" });
    fetch("/api/configuracoes").then(r => r.json()).then(d => {
      setOficina(d.oficina || {});
      setAddons(d.addons || {});
    }).catch(console.error);
  }, [session]);

  const handleSaveOficina = async () => {
    await fetch("/api/configuracoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oficina }) });
    alert("Dados da oficina guardados.");
  };

  const handleSaveAddons = async () => {
    await fetch("/api/configuracoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addons }) });
    alert("Addons atualizados.");
  };

  const handleSavePerfil = async () => {
    await fetch("/api/usuario/avatar", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: perfil.nome, avatar: perfil.avatar }) });
    update();
    alert("Perfil atualizado.");
  };

  const podeVerWhatsApp = session?.user?.nivel === "SUPER_ADMIN";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
      
      <Tabs defaultValue="perfil">
        <TabsList className="bg-gray-100 dark:bg-gray-800 flex flex-wrap">
          <TabsTrigger value="perfil"><User className="h-4 w-4 mr-2" /> Meu Perfil</TabsTrigger>
          <TabsTrigger value="oficina"><Store className="h-4 w-4 mr-2" /> Dados da Oficina</TabsTrigger>
          <TabsTrigger value="addons"><Smartphone className="h-4 w-4 mr-2" /> Módulos Adicionais</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader><CardTitle className="text-gray-900 dark:text-white">Meu Perfil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-gray-700 dark:text-gray-300">Nome</Label><Input className="bg-gray-100 dark:bg-gray-700" value={perfil.nome} onChange={e => setPerfil({...perfil, nome: e.target.value})} /></div>
              <div><Label className="text-gray-700 dark:text-gray-300">Email</Label><Input className="bg-gray-100 dark:bg-gray-700" value={perfil.email} disabled /></div>
              <div><Label className="text-gray-700 dark:text-gray-300">Avatar (URL)</Label><Input className="bg-gray-100 dark:bg-gray-700" value={perfil.avatar} onChange={e => setPerfil({...perfil, avatar: e.target.value})} /></div>
              <Button onClick={handleSavePerfil} className="bg-blue-600">Guardar Perfil</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oficina">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader><CardTitle className="text-gray-900 dark:text-white">Dados da Oficina</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-gray-700 dark:text-gray-300">Nome da Oficina</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.nome} onChange={e => setOficina({...oficina, nome: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Telefone</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.telefone} onChange={e => setOficina({...oficina, telefone: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Email</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.email} onChange={e => setOficina({...oficina, email: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Morada</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.endereco} onChange={e => setOficina({...oficina, endereco: e.target.value})} /></div>
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">📍 Localização para Ponto Eletrónico</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label className="text-gray-700 dark:text-gray-300">Latitude</Label><Input className="bg-gray-100 dark:bg-gray-700" placeholder="38.7223" value={oficina.latitude} onChange={e => setOficina({...oficina, latitude: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Longitude</Label><Input className="bg-gray-100 dark:bg-gray-700" placeholder="-9.1393" value={oficina.longitude} onChange={e => setOficina({...oficina, longitude: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Raio (metros)</Label><Input className="bg-gray-100 dark:bg-gray-700" type="number" value={oficina.raioPermitido} onChange={e => setOficina({...oficina, raioPermitido: e.target.value})} /></div>
              </div>
              <Button onClick={handleSaveOficina} className="bg-blue-600">Guardar Dados</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addons">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader><CardTitle className="text-gray-900 dark:text-white">Módulos Adicionais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Ponto Eletrónico */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Ponto Eletrónico</p>
                    <p className="text-sm text-gray-500">Registo de entrada/saída dos funcionários</p>
                  </div>
                </div>
                <Switch checked={addons.ponto} onCheckedChange={v => setAddons({...addons, ponto: v})} />
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">WhatsApp</p>
                    <p className="text-sm text-gray-500">Notificações via WhatsApp</p>
                  </div>
                </div>
                {podeVerWhatsApp ? (
                  <Switch checked={addons.whatsapp} onCheckedChange={v => setAddons({...addons, whatsapp: v})} />
                ) : (
                  <span className="text-xs text-gray-400">Gerido pelo administrador</span>
                )}
              </div>

              {/* SMS */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">SMS</p>
                    <p className="text-sm text-gray-500">Notificações via SMS</p>
                  </div>
                </div>
                <Switch checked={addons.sms} onCheckedChange={v => setAddons({...addons, sms: v})} />
              </div>

              {/* GPS */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">GPS Autotrack</p>
                    <p className="text-sm text-gray-500">Rastreamento de veículos em tempo real</p>
                  </div>
                </div>
                <Switch checked={addons.gps} onCheckedChange={v => setAddons({...addons, gps: v})} />
              </div>

              {/* Fidelidade */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Programa de Fidelidade</p>
                    <p className="text-sm text-gray-500">Programa de recompensas para clientes</p>
                  </div>
                </div>
                <Switch checked={addons.pontos} onCheckedChange={v => setAddons({...addons, pontos: v})} />
              </div>

              {/* Portal do Cliente */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Portal do Cliente</p>
                    <p className="text-sm text-gray-500">Acesso para clientes acompanharem as OS</p>
                  </div>
                </div>
                <Switch checked={addons.portal} onCheckedChange={v => setAddons({...addons, portal: v})} />
              </div>

              <Button onClick={handleSaveAddons} className="bg-blue-600 mt-4">Guardar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
