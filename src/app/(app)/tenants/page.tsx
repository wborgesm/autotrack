"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil } from "lucide-react";

export default function TenantsPage() {
  const { data: session } = useSession();
  const [tenants, setTenants] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<any>(null);
  const [form, setForm] = useState({ nomeEmpresa: "", emailAdmin: "", nomeAdmin: "", senhaAdmin: "", plano: "STARTER" });
  const [editForm, setEditForm] = useState({ nome: "", plano: "STARTER", ativo: true, addonGps: false, addonPontos: false, addonWhatsapp: false, addonPortalCliente: false });

  useEffect(() => {
    if (!session || session.user.nivel !== "SUPER_ADMIN") return;
    fetch("/api/tenants").then(r => r.json()).then(setTenants);
  }, [session]);

  const handleCreate = async () => {
    const res = await fetch("/api/tenants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setCreateOpen(false);
      setForm({ nomeEmpresa: "", emailAdmin: "", nomeAdmin: "", senhaAdmin: "", plano: "STARTER" });
      fetch("/api/tenants").then(r => r.json()).then(setTenants);
    } else { const err = await res.json(); alert(err.error); }
  };

  const openEdit = (t: any) => {
    setEditTenant(t);
    setEditForm({ nome: t.nome, plano: t.plano, ativo: t.ativo, addonGps: t.addonGps || false, addonPontos: t.addonPontos || false, addonWhatsapp: t.addonWhatsapp || false, addonPortalCliente: t.addonPortalCliente || false });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTenant) return;
    await fetch(`/api/tenants/${editTenant.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setEditOpen(false);
    fetch("/api/tenants").then(r => r.json()).then(setTenants);
  };

  if (session?.user.nivel !== "SUPER_ADMIN") return <div className="p-6">Acesso restrito ao SUPER_ADMIN.</div>;

  const planosInfo: Record<string, { nome: string; cor: string }> = { STARTER: { nome: "Starter", cor: "bg-gray-600" }, PROFISSIONAL: { nome: "Profissional", cor: "bg-blue-600" }, BUSINESS: { nome: "Business", cor: "bg-emerald-600" } };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Empresas</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Nova Empresa</Button></DialogTrigger>
          <DialogContent aria-describedby="tenant-create-desc">
            <DialogHeader><DialogTitle>Criar Empresa</DialogTitle></DialogHeader>
            <p id="tenant-create-desc" className="hidden">Formulário</p>
            <div className="grid gap-4">
              <div><Label>Nome</Label><Input value={form.nomeEmpresa} onChange={e => setForm({...form, nomeEmpresa: e.target.value})} /></div>
              <div><Label>Plano</Label><Select value={form.plano} onValueChange={v => setForm({...form, plano: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STARTER">STARTER</SelectItem><SelectItem value="PROFISSIONAL">PROFISSIONAL</SelectItem><SelectItem value="BUSINESS">BUSINESS</SelectItem></SelectContent></Select></div>
              <div className="border-t pt-4"><p className="font-semibold mb-4">Admin</p></div>
              <div><Label>Nome</Label><Input value={form.nomeAdmin} onChange={e => setForm({...form, nomeAdmin: e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={form.emailAdmin} onChange={e => setForm({...form, emailAdmin: e.target.value})} /></div>
              <div><Label>Password</Label><Input type="password" value={form.senhaAdmin} onChange={e => setForm({...form, senhaAdmin: e.target.value})} /></div>
              <Button onClick={handleCreate} className="bg-green-600">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader><CardTitle className="text-gray-900 dark:text-white">Empresas Registadas</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow className="border-gray-200 dark:border-gray-700"><TableHead className="text-gray-600 dark:text-gray-400">Nome</TableHead><TableHead className="text-gray-600 dark:text-gray-400">Plano</TableHead><TableHead className="text-gray-600 dark:text-gray-400">Users</TableHead><TableHead className="text-gray-600 dark:text-gray-400">Estado</TableHead><TableHead className="text-gray-600 dark:text-gray-400">Ações</TableHead></TableRow></TableHeader>
            <TableBody>{tenants.map((t: any) => (<TableRow key={t.id} className="border-gray-200 dark:border-gray-700"><TableCell className="text-gray-900 dark:text-gray-200">{t.nome}</TableCell><TableCell><Badge className={planosInfo[t.plano]?.cor}>{planosInfo[t.plano]?.nome || t.plano}</Badge></TableCell><TableCell className="text-gray-900 dark:text-gray-200">{t._count?.usuarios || 0}</TableCell><TableCell><Badge className={t.ativo ? "bg-green-600" : "bg-red-600"}>{t.ativo ? "Ativo" : "Inativo"}</Badge></TableCell><TableCell><Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" onClick={() => openEdit(t)}><Pencil className="h-4 w-4 mr-1" /> Editar</Button></TableCell></TableRow>))}</TableBody></Table>
        </CardContent>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby="tenant-edit-desc" className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader><DialogTitle className="text-gray-900 dark:text-white">Editar Empresa</DialogTitle></DialogHeader>
          <p id="tenant-edit-desc" className="hidden">Formulário</p>
          <div className="grid gap-4">
            <div><Label className="text-gray-700 dark:text-gray-300">Nome</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600" value={editForm.nome} onChange={e => setEditForm({...editForm, nome: e.target.value})} /></div>
            <div><Label className="text-gray-700 dark:text-gray-300">Plano</Label><Select value={editForm.plano} onValueChange={v => setEditForm({...editForm, plano: v})}><SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"><SelectValue /></SelectTrigger><SelectContent className="bg-white dark:bg-gray-800"><SelectItem value="STARTER">STARTER</SelectItem><SelectItem value="PROFISSIONAL">PROFISSIONAL</SelectItem><SelectItem value="BUSINESS">BUSINESS</SelectItem></SelectContent></Select></div>
            <div className="flex items-center justify-between"><Label className="text-gray-700 dark:text-gray-300">Ativo</Label><Switch checked={editForm.ativo} onCheckedChange={v => setEditForm({...editForm, ativo: v})} /></div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2"><p className="font-semibold text-gray-900 dark:text-white mb-2">Addons</p></div>
            {[{ key: "addonGps", label: "GPS / Rastreamento" }, { key: "addonPontos", label: "Fidelidade" }, { key: "addonWhatsapp", label: "WhatsApp" }, { key: "addonPortalCliente", label: "Portal do Cliente" }].map(a => (<div key={a.key} className="flex items-center justify-between"><Label className="text-gray-700 dark:text-gray-300">{a.label}</Label><Switch checked={(editForm as any)[a.key] || false} onCheckedChange={v => setEditForm({...editForm, [a.key]: v})} /></div>))}
            <Button onClick={handleEdit} className="bg-blue-600">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
