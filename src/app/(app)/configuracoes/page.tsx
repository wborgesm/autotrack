"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Store, Smartphone, Star, MapPin, MessageCircle, Globe, Clock, Bell, Camera, Facebook, Instagram, Music, Receipt, Building } from "lucide-react";

export default function ConfiguracoesPage() {
  const { data: session, update } = useSession();
  const [perfil, setPerfil] = useState({ nome: "", email: "", avatar: "" });
  const [oficina, setOficina] = useState<any>({});
  const [addons, setAddons] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) { const data = await res.json(); setPerfil(p => ({ ...p, avatar: data.url })); }
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleSavePerfil = async () => {
    await fetch("/api/usuario/avatar", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: perfil.nome, avatar: perfil.avatar }) });
    update(); alert("Perfil atualizado.");
  };

  const handleSaveOficina = async () => {
    const res = await fetch("/api/configuracoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oficina }) });
    if (res.ok) alert("Dados guardados."); else alert("Erro ao guardar.");
  };

  const handleSaveAddons = async () => {
    const res = await fetch("/api/configuracoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addons }) });
    if (res.ok) alert("Addons atualizados."); else alert("Erro ao guardar.");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Tabs defaultValue="perfil">
        <TabsList className="bg-gray-100 dark:bg-gray-800 flex flex-wrap">
          <TabsTrigger value="perfil"><User className="h-4 w-4 mr-2" /> Meu Perfil</TabsTrigger>
          <TabsTrigger value="oficina"><Store className="h-4 w-4 mr-2" /> Dados da Oficina</TabsTrigger>
          <TabsTrigger value="fiscal"><Receipt className="h-4 w-4 mr-2" /> Faturação</TabsTrigger>
          <TabsTrigger value="addons"><Smartphone className="h-4 w-4 mr-2" /> Módulos Adicionais</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card><CardHeader><CardTitle>Meu Perfil</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {perfil.avatar ? (
                  <img src={perfil.avatar.startsWith("/uploads") ? perfil.avatar : perfil.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" />
                ) : (
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">{session?.user?.name?.charAt(0) || "U"}</div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-lg border hover:bg-gray-100"><Camera className="h-4 w-4" /></button>
              </div>
              <div><p className="font-medium">{perfil.nome}</p><p className="text-sm text-gray-500">{perfil.email}</p><Button variant="link" className="p-0 h-auto text-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? "A enviar..." : "Alterar foto"}</Button></div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
            <div><Label>Nome</Label><Input className="bg-gray-100 dark:bg-gray-700" value={perfil.nome} onChange={e => setPerfil({...perfil, nome: e.target.value})} /></div>
            <div><Label>Email</Label><Input className="bg-gray-100 dark:bg-gray-700" value={perfil.email} disabled /></div>
            <Button onClick={handleSavePerfil} className="bg-blue-600">Guardar Perfil</Button>
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
                <div className="border-t pt-4"><p className="font-semibold mb-2">🔗 Redes Sociais</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2"><Facebook className="h-5 w-5 text-blue-600" /><Input className="bg-gray-100 dark:bg-gray-700" placeholder="Facebook" value={oficina.facebook || ""} onChange={e => setOficina({...oficina, facebook: e.target.value})} /></div>
                    <div className="flex items-center gap-2"><Instagram className="h-5 w-5 text-pink-600" /><Input className="bg-gray-100 dark:bg-gray-700" placeholder="Instagram" value={oficina.instagram || ""} onChange={e => setOficina({...oficina, instagram: e.target.value})} /></div>
                    <div className="flex items-center gap-2"><Music className="h-5 w-5" /><Input className="bg-gray-100 dark:bg-gray-700" placeholder="TikTok" value={oficina.tiktok || ""} onChange={e => setOficina({...oficina, tiktok: e.target.value})} /></div>
                  </div>
                </div>
                <div className="border-t pt-4"><p className="font-semibold mb-2">📍 Localização para Ponto</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Latitude</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.latitude || ""} onChange={e => setOficina({...oficina, latitude: e.target.value})} /></div>
                    <div><Label>Longitude</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.longitude || ""} onChange={e => setOficina({...oficina, longitude: e.target.value})} /></div>
                    <div><Label>Raio (m)</Label><Input className="bg-gray-100 dark:bg-gray-700" type="number" value={oficina.raioPermitido || "100"} onChange={e => setOficina({...oficina, raioPermitido: e.target.value})} /></div>
                  </div>
                </div>
                <Button onClick={handleSaveOficina} className="bg-blue-600">Guardar</Button>
              </>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card><CardHeader><CardTitle>Faturação Certificada (Moloni)</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Configure aqui as credenciais da API Moloni. Estas credenciais são obtidas em{' '}
                <a href="https://www.moloni.pt/dev/criar-uma-conta/" target="_blank" className="underline font-semibold">Moloni Developers</a>.
                Após ativar a API, terá acesso ao <strong>Developer ID</strong> e <strong>Client Secret</strong>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Developer ID</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.moloniDevId || ""} onChange={e => setOficina({...oficina, moloniDevId: e.target.value})} disabled={!podeEditarOficina} placeholder="ID do Developer" /></div>
              <div><Label>Client Secret</Label><Input className="bg-gray-100 dark:bg-gray-700" type="password" value={oficina.moloniSecret || ""} onChange={e => setOficina({...oficina, moloniSecret: e.target.value})} disabled={!podeEditarOficina} placeholder="Chave secreta" /></div>
              <div><Label>Email da conta Moloni</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.moloniEmail || ""} onChange={e => setOficina({...oficina, moloniEmail: e.target.value})} disabled={!podeEditarOficina} placeholder="email@exemplo.com" /></div>
              <div><Label>Password da conta Moloni</Label><Input className="bg-gray-100 dark:bg-gray-700" type="password" value={oficina.moloniPass || ""} onChange={e => setOficina({...oficina, moloniPass: e.target.value})} disabled={!podeEditarOficina} placeholder="Password" /></div>
              <div><Label>ID da Empresa (Company ID)</Label><Input className="bg-gray-100 dark:bg-gray-700" value={oficina.moloniCompanyId || ""} onChange={e => setOficina({...oficina, moloniCompanyId: e.target.value})} disabled={!podeEditarOficina} placeholder="ID numérico" /></div>
            </div>
            {podeEditarOficina && <Button onClick={handleSaveOficina} className="bg-blue-600">Guardar Configurações Fiscais</Button>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="addons">
          <Card><CardHeader><CardTitle>Módulos Adicionais</CardTitle></CardHeader><CardContent className="space-y-4">
            {[
              { key: "ponto", icon: Clock, color: "text-blue-500", label: "Ponto Eletrónico", desc: "Registo de entrada/saída" },
              { key: "whatsapp", icon: MessageCircle, color: "text-green-500", label: "WhatsApp", desc: "Notificações via WhatsApp" },
              { key: "sms", icon: Bell, color: "text-yellow-500", label: "SMS", desc: "Notificações via SMS" },
              { key: "gps", icon: MapPin, color: "text-blue-500", label: "GPS Autotrack", desc: "Rastreamento em tempo real" },
              { key: "pontos", icon: Star, color: "text-yellow-500", label: "Fidelidade", desc: "Recompensas para clientes" },
              { key: "portal", icon: Globe, color: "text-purple-500", label: "Portal do Cliente", desc: "Acompanhamento de OS" }
            ].map(a => (
              <div key={a.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3"><a.icon className={`h-6 w-6 ${a.color}`} /><div><p className="font-medium">{a.label}</p><p className="text-sm text-gray-500">{a.desc}</p></div></div>
                <Switch checked={addons[a.key] || false} onCheckedChange={podeEditarAddons ? (v: boolean) => setAddons({...addons, [a.key]: v}) : undefined} disabled={!podeEditarAddons} className={!podeEditarAddons ? "opacity-50 cursor-not-allowed" : ""} />
              </div>
            ))}
            {podeEditarAddons && <Button onClick={handleSaveAddons} className="bg-blue-600 mt-4">Guardar Configurações</Button>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
