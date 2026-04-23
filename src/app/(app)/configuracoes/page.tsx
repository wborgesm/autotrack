"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Camera, Trash2 } from "lucide-react";

export default function ConfiguracoesPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchConfig = async () => {
    setLoading(true);
    const res = await fetch("/api/configuracoes");
    const data = await res.json();
    setConfig(data);
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchConfig();
  }, [session]);

  const handleChange = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const allowedFields = [
      "nome", "cnpj", "telefone", "email", "endereco", "logo",
      "addonGps", "addonPontos", "addonWhatsapp", "addonPortalCliente",
      "pontosPorReal", "bonusMoto", "minimoResgate", "validadeMeses"
    ];

    const payload: any = {};
    for (const key of allowedFields) {
      if (config.hasOwnProperty(key)) {
        let val = config[key];
        if (["pontosPorReal", "bonusMoto", "minimoResgate", "validadeMeses"].includes(key)) {
          if (val === "" || val === null || val === undefined) continue;
          const num = Number(val);
          if (isNaN(num)) continue;
          val = num;
        }
        payload[key] = val;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Configurações guardadas com sucesso!");
        await fetchConfig();
      } else {
        const err = await res.json();
        alert("Erro: " + (err.error?.[0]?.message || err.error || "Erro ao guardar"));
      }
    } catch (error) {
      alert("Erro de rede ao guardar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/usuario/avatar", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        // Atualiza a sessão e força a atualização do avatar no sidebar
        await update({ ...session, user: { ...session?.user, avatar: data.avatarUrl } });
        setAvatarPreview(null); // limpa o preview local
        alert("Foto de perfil atualizada!");
      } else {
        const err = await res.json();
        alert(err.error || "Erro no upload");
      }
    } catch (error) {
      alert("Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Remover a foto de perfil?")) return;
    setRemoving(true);
    try {
      const res = await fetch("/api/usuario/avatar", { method: "DELETE" });
      if (res.ok) {
        await update({ ...session, user: { ...session?.user, avatar: null } });
        setAvatarPreview(null);
        alert("Foto removida.");
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao remover");
      }
    } catch (error) {
      alert("Erro ao remover imagem");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) return <div className="p-6">A carregar...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="perfil" className="space-y-4">
          <TabsList>
            <TabsTrigger value="perfil">Meu Perfil</TabsTrigger>
            <TabsTrigger value="geral">Dados da Oficina</TabsTrigger>
            <TabsTrigger value="addons">Módulos Adicionais</TabsTrigger>
            <TabsTrigger value="fidelidade">Programa de Fidelidade</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <Card>
              <CardHeader><CardTitle>Meu Perfil</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <img
                      src={avatarPreview || session?.user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23e2e8f0'/%3E%3Ctext x='75' y='75' font-size='14' text-anchor='middle' dy='.3em' fill='%2394a3b8'%3EAvatar%3C/text%3E%3C/svg%3E"}
                      alt="Avatar"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                    <div className="absolute bottom-0 right-0 flex gap-1">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploading || removing}
                        className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700"
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </button>
                      {session?.user.avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={removing}
                          className="bg-red-600 p-2 rounded-full text-white hover:bg-red-700"
                        >
                          {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Clique na câmara para alterar a foto. Use o ícone de lixo para removê‑la.</p>
                </div>
                <div className="grid gap-4">
                  <div><Label>Nome</Label><Input value={session?.user.name || ""} disabled /></div>
                  <div><Label>Email</Label><Input value={session?.user.email || ""} disabled /></div>
                  <div><Label>Nível de Acesso</Label><Input value={session?.user.nivel || ""} disabled /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geral">
            <Card>
              <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nome da Oficina</Label><Input value={config.nome || ""} onChange={e => handleChange("nome", e.target.value)} /></div>
                  <div><Label>NIF</Label><Input value={config.cnpj || ""} onChange={e => handleChange("cnpj", e.target.value)} /></div>
                  <div><Label>Telefone</Label><Input value={config.telefone || ""} onChange={e => handleChange("telefone", e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" value={config.email || ""} onChange={e => handleChange("email", e.target.value)} /></div>
                  <div className="col-span-2"><Label>Morada</Label><Input value={config.endereco || ""} onChange={e => handleChange("endereco", e.target.value)} /></div>
                  <div className="col-span-2"><Label>URL do Logótipo</Label><Input value={config.logo || ""} onChange={e => handleChange("logo", e.target.value)} /></div>
                </div>
                <div><Label>Plano Atual</Label><Input value={config.plano} disabled className="bg-gray-100" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addons">
            <Card>
              <CardHeader><CardTitle>Módulos Adicionais</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label className="text-base">GPS Autotrack</Label><p className="text-sm text-gray-500">Rastreamento de veículos em tempo real</p></div>
                  <Switch checked={config.addonGps} onCheckedChange={(v) => handleChange("addonGps", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label className="text-base">Pontos de Fidelidade</Label><p className="text-sm text-gray-500">Programa de recompensas para clientes</p></div>
                  <Switch checked={config.addonPontos} onCheckedChange={(v) => handleChange("addonPontos", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label className="text-base">WhatsApp</Label><p className="text-sm text-gray-500">Notificações via WhatsApp (brevemente)</p></div>
                  <Switch checked={config.addonWhatsapp} onCheckedChange={(v) => handleChange("addonWhatsapp", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label className="text-base">Portal do Cliente</Label><p className="text-sm text-gray-500">Acesso para clientes acompanharem as OS</p></div>
                  <Switch checked={config.addonPortalCliente} onCheckedChange={(v) => handleChange("addonPortalCliente", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fidelidade">
            <Card>
              <CardHeader><CardTitle>Configurações de Pontos</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Pontos por € gasto</Label><Input type="number" value={config.pontosPorReal ?? ""} onChange={e => handleChange("pontosPorReal", e.target.value)} /></div>
                  <div><Label>Bónus para motos (%)</Label><Input type="number" value={config.bonusMoto ?? ""} onChange={e => handleChange("bonusMoto", e.target.value)} /></div>
                  <div><Label>Mínimo para resgate</Label><Input type="number" value={config.minimoResgate ?? ""} onChange={e => handleChange("minimoResgate", e.target.value)} /></div>
                  <div><Label>Validade (meses)</Label><Input type="number" value={config.validadeMeses ?? ""} onChange={e => handleChange("validadeMeses", e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
