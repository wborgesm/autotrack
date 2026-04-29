"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, User, Shield, Mail, Calendar, Edit, Trash2, LogIn, Search, Building } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TODOS_RECURSOS, NIVEIS_CRIAVEIS, PERMISSOES_BASE } from "@/lib/permissoes";

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", nivel: "GERENTE", permissoes: [] as string[], tenantId: "" });
  const [editForm, setEditForm] = useState({ nivel: "", permissoes: [] as string[] });
  const [tenants, setTenants] = useState<any[]>([]);

  const fetchUsuarios = () => {
    fetch("/api/usuarios")
      .then(r => r.json())
      .then(d => setUsuarios(Array.isArray(d) ? d : d.usuarios || []))
      .catch(() => setUsuarios([]));
  };

  useEffect(() => {
    if (session) {
      fetchUsuarios();
      if (session.user.nivel === "SUPER_ADMIN") {
        fetch("/api/tenants").then(r => r.json()).then(d => setTenants(Array.isArray(d) ? d : []));
      }
    }
  }, [session]);

  const isSuperAdmin = session?.user?.nivel === "SUPER_ADMIN";
  const criadorNivel = session?.user?.nivel as string;
  const niveisPermitidos = NIVEIS_CRIAVEIS[criadorNivel as keyof typeof NIVEIS_CRIAVEIS] || [];

  // Filtro local por busca
  const usuariosFiltrados = busca.trim()
    ? usuarios.filter(u =>
        u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        u.email?.toLowerCase().includes(busca.toLowerCase()) ||
        u.nivel?.toLowerCase().includes(busca.toLowerCase()) ||
        u.oficina?.toLowerCase().includes(busca.toLowerCase())
      )
    : usuarios;

  const updateNivel = (novoNivel: string) => {
    const base = (PERMISSOES_BASE as any)[novoNivel] || [];
    setForm(prev => ({ ...prev, nivel: novoNivel, permissoes: base }));
  };

  const toggleCreatePermissao = (recurso: string) => {
    setForm(prev => {
      const list = prev.permissoes.includes(recurso)
        ? prev.permissoes.filter(r => r !== recurso)
        : [...prev.permissoes, recurso];
      return { ...prev, permissoes: list };
    });
  };

  const handleCreate = async () => {
    const body: any = {
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      nivel: form.nivel,
      permissoes: form.permissoes,
    };
    if (isSuperAdmin && form.tenantId) body.tenantId = form.tenantId;

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ nome: "", email: "", senha: "", nivel: "GERENTE", permissoes: [], tenantId: "" });
      fetchUsuarios();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao criar utilizador");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Apagar ${userName}?`)) return;
    await fetch(`/api/usuarios?id=${userId}`, { method: "DELETE" });
    fetchUsuarios();
  };

  const handleImpersonate = async (userId: string) => {
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.redirected || res.ok) window.location.href = "/dashboard";
    else {
      const err = await res.json();
      alert(err.error || "Erro ao assumir identidade");
    }
  };

  const handleEditOpen = (user: any) => {
    setEditUser(user);
    setEditForm({ nivel: user.nivel, permissoes: user.permissoes || [] });
    setEditDialogOpen(true);
  };

  const toggleEditPermissao = (recurso: string) => {
    setEditForm(prev => {
      const list = prev.permissoes.includes(recurso)
        ? prev.permissoes.filter(r => r !== recurso)
        : [...prev.permissoes, recurso];
      return { ...prev, permissoes: list };
    });
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    const res = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editUser.id, nivel: editForm.nivel, permissoes: editForm.permissoes }),
    });
    if (res.ok) { setEditDialogOpen(false); fetchUsuarios(); }
    else { const err = await res.json(); alert(err.error || "Erro ao atualizar"); }
  };

  const revogarSessoes = async (id: string) => {
    if (!confirm("Revogar todas as sessões deste utilizador?")) return;
    await fetch(`/api/usuarios/${id}/sessoes`, { method: "DELETE" });
    alert("Sessões revogadas.");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Utilizadores</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerir acessos da sua equipa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Novo Utilizador</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Novo Utilizador</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><Label>Password</Label><Input type="password" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} /></div>
              <div>
                <Label>Nível</Label>
                <Select value={form.nivel} onValueChange={updateNivel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {niveisPermitidos.map(nivel => (
                      <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isSuperAdmin && (
                <div>
                  <Label>Empresa (Tenant)</Label>
                  <Select value={form.tenantId} onValueChange={v => setForm({...form, tenantId: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecionar empresa" /></SelectTrigger>
                    <SelectContent>
                      {tenants.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="mb-2 block">Permissões (pode adicionar ou remover)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded p-3">
                  {TODOS_RECURSOS.map(recurso => (
                    <div key={recurso} className="flex items-center gap-2">
                      <Checkbox checked={form.permissoes.includes(recurso)} onCheckedChange={() => toggleCreatePermissao(recurso)} />
                      <span className="text-sm">{recurso}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="bg-green-600">Criar Utilizador</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campo de busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, email, nível, oficina..."
          className="pl-9"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* Grid de cartões */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuariosFiltrados.map((u: any) => (
          <Card key={u.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => handleEditOpen(u)}>
            <div className={`p-4 text-white ${u.nivel === "SUPER_ADMIN" ? "bg-red-600" : u.nivel === "ADMIN" ? "bg-blue-600" : u.nivel === "GERENTE" ? "bg-emerald-600" : u.nivel === "TECNICO" ? "bg-amber-600" : u.nivel === "RECEPCIONISTA" ? "bg-violet-600" : "bg-gray-600"}`}>
              <div className="flex items-center justify-between">
                {u.avatar ? <img src={u.avatar} alt={u.nome} className="w-12 h-12 rounded-full object-cover border-2 border-white/50" /> : <div className="bg-white/20 rounded-full p-3"><User className="h-6 w-6" /></div>}
                <Badge className="bg-white/20 text-white border-0">{u.nivel}</Badge>
              </div>
              <h3 className="text-lg font-bold mt-3">{u.nome}</h3>
              {/* Nome da oficina */}
              {isSuperAdmin && u.oficina && (
                <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
                  <Building className="h-3 w-3" /> {u.oficina}
                </p>
              )}
            </div>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Mail className="h-4 w-4" /> {u.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(u.createdAt)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Shield className="h-4 w-4" /> {u.ativo ? "Ativo" : "Inativo"}</p>
              <div className="flex justify-end gap-2">
                {isSuperAdmin && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleImpersonate(u.id); }}><LogIn className="h-4 w-4" /></Button>}
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditOpen(u); }}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(u.id, u.nome); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Editar {editUser?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {isSuperAdmin && <Button variant="destructive" size="sm" onClick={() => revogarSessoes(editUser.id)}>Revogar sessões</Button>}
            <div>
              <Label>Nível</Label>
              <Select value={editForm.nivel} onValueChange={v => setEditForm(prev => ({ ...prev, nivel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {niveisPermitidos.map(nivel => <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Permissões</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded p-3">
                {TODOS_RECURSOS.map(recurso => (
                  <div key={recurso} className="flex items-center gap-2">
                    <Checkbox checked={editForm.permissoes.includes(recurso)} onCheckedChange={() => toggleEditPermissao(recurso)} />
                    <span className="text-sm">{recurso}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleEditSave} className="w-full">Guardar alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
