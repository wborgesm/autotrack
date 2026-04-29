"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, User, Shield, Mail, Calendar, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { recursosExtrasDisponiveis, NIVEIS_CRIAVEIS, Recurso } from "@/lib/permissoes";

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", nivel: "GERENTE" });
  const [editForm, setEditForm] = useState({ nivel: "", permissoesExtras: [] as string[] });

  const fetchUsuarios = () => {
    fetch("/api/usuarios")
      .then(r => r.json())
      .then(d => setUsuarios(Array.isArray(d) ? d : []))
      .catch(() => setUsuarios([]));
  };

  useEffect(() => { if (session) fetchUsuarios(); }, [session]);

  const handleCreate = async () => {
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setDialogOpen(false); setForm({ nome: "", email: "", senha: "", nivel: "GERENTE" }); fetchUsuarios(); }
    else { const err = await res.json(); alert(err.error || "Erro ao criar utilizador"); }
  };

  const handleEditOpen = (user: any) => {
    setEditUser(user);
    setEditForm({
      nivel: user.nivel,
      permissoesExtras: user.permissoesExtras || [],
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    const res = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editUser.id,
        nivel: editForm.nivel,
        permissoesExtras: editForm.permissoesExtras,
      }),
    });
    if (res.ok) {
      setEditDialogOpen(false);
      fetchUsuarios();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao atualizar");
    }
  };

  const nivelColor = (nivel: string) => {
    switch (nivel) {
      case "SUPER_ADMIN": return "bg-red-600 text-white";
      case "ADMIN": return "bg-blue-600 text-white";
      case "GERENTE": return "bg-emerald-600 text-white";
      case "TECNICO": return "bg-amber-600 text-white";
      case "RECEPCIONISTA": return "bg-violet-600 text-white";
      default: return "bg-gray-600 text-white";
    }
  };

  const podeCriar = session?.user?.nivel === "SUPER_ADMIN" || session?.user?.nivel === "ADMIN";
  const criadorNivel = session?.user?.nivel as string;
  const niveisPermitidos = NIVEIS_CRIAVEIS[criadorNivel as keyof typeof NIVEIS_CRIAVEIS] || [];

  // Recursos disponíveis para o nível selecionado no diálogo de edição
  const extrasDisponiveis = recursosExtrasDisponiveis(editForm.nivel as any);
  const toggleExtra = (recurso: string) => {
    setEditForm(prev => {
      const list = prev.permissoesExtras || [];
      if (list.includes(recurso)) return { ...prev, permissoesExtras: list.filter(r => r !== recurso) };
      else return { ...prev, permissoesExtras: [...list, recurso] };
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Utilizadores</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerir acessos da sua equipa</p>
        </div>
        {podeCriar && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Novo Utilizador</Button>
            </DialogTrigger>
            <DialogContent aria-describedby="user-form-desc" className="sm:max-w-md">
              <p id="user-form-desc" className="hidden">Formulário de criação de utilizador</p>
              <DialogHeader><DialogTitle>Novo Utilizador</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><Label>Password</Label><Input type="password" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} /></div>
                <div><Label>Nível</Label>
                  <Select value={form.nivel} onValueChange={v => setForm({...form, nivel: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {niveisPermitidos.map(nivel => (
                        <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="bg-green-600">Criar Utilizador</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuarios.map((u: any) => (
          <Card
            key={u.id}
            className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => handleEditOpen(u)}
          >
            <div className={`p-4 text-white ${nivelColor(u.nivel)}`}>
              <div className="flex items-center justify-between">
            {u.avatar ? (

              <img src={u.avatar} alt={u.nome} className="w-12 h-12 rounded-full object-cover border-2 border-white/50" />

            ) : (

              <div className="bg-white/20 rounded-full p-3">

                <User className="h-6 w-6" />

              </div>

            )}
                <Badge className="bg-white/20 text-white border-0">{u.nivel}</Badge>
              </div>
              <h3 className="text-lg font-bold mt-3">{u.nome}</h3>
            </div>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Mail className="h-4 w-4" /> {u.email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {formatDate(u.createdAt)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Shield className="h-4 w-4" /> {u.ativo ? "Ativo" : "Inativo"}
              </p>
              <div className="flex justify-end">
                <Edit className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {usuarios.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <User className="h-12 w-12 mx-auto mb-2" />
          <p>Nenhum utilizador encontrado</p>
        </div>
      )}

      {/* Diálogo de edição de permissões */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar {editUser?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nível</Label>
              <Select
                value={editForm.nivel}
                onValueChange={v => setEditForm(prev => ({ ...prev, nivel: v, permissoesExtras: [] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {niveisPermitidos.map(nivel => (
                    <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {extrasDisponiveis.length > 0 && (
              <div>
                <Label className="mb-2 block">Permissões extras (adicionais ao nível base)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {extrasDisponiveis.map(recurso => (
                    <div key={recurso} className="flex items-center gap-2">
                      <Checkbox
                        checked={editForm.permissoesExtras?.includes(recurso)}
                        onCheckedChange={() => toggleExtra(recurso)}
                      />
                      <span className="text-sm">{recurso}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleEditSave} className="w-full">Guardar alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
