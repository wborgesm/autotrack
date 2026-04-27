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
import { Plus, User, Shield, Mail, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", nivel: "GERENTE" });

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
                      <SelectItem value="GERENTE">Gerente</SelectItem>
                      <SelectItem value="TECNICO">Técnico</SelectItem>
                      <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                      {session?.user?.nivel === "SUPER_ADMIN" && (
                        <>
                          <SelectItem value="ADMIN">Admin (Empresa)</SelectItem>
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        </>
                      )}
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
          <Card key={u.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className={`p-4 text-white ${nivelColor(u.nivel)}`}>
              <div className="flex items-center justify-between">
                <div className="bg-white/20 rounded-full p-3">
                  <User className="h-6 w-6" />
                </div>
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
    </div>
  );
}
