"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivel: string;
  avatar?: string;
  ativo: boolean;
}

const NIVEL_HIERARQUIA: Record<string, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  GERENTE: 3,
  TECNICO: 2,
  RECEPCIONISTA: 1,
  CLIENTE: 0,
};

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [zoomedAvatar, setZoomedAvatar] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    nivel: "TECNICO" as any,
  });

  const fetchUsuarios = async () => {
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    setUsuarios(data);
  };

  useEffect(() => {
    if (session) fetchUsuarios();
  }, [session]);

  const podeEditar = (usuario: Usuario) => {
    if (!session?.user) return false;
    const meuNivel = NIVEL_HIERARQUIA[session.user.nivel] || 0;
    const nivelAlvo = NIVEL_HIERARQUIA[usuario.nivel] || 0;
    if (session.user.nivel === "SUPER_ADMIN") return true;
    if (session.user.nivel === "ADMIN") return nivelAlvo < 4;
    return meuNivel > nivelAlvo;
  };

  const handleSubmit = async () => {
    const url = editUser ? `/api/usuarios/${editUser.id}` : "/api/usuarios";
    const method = editUser ? "PATCH" : "POST";
    const body = editUser
      ? { nome: form.nome, email: form.email, nivel: form.nivel, senha: form.senha || undefined }
      : form;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setDialogOpen(false);
      setEditUser(null);
      setForm({ nome: "", email: "", senha: "", nivel: "TECNICO" });
      fetchUsuarios();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Desativar este utilizador?")) return;
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    fetchUsuarios();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Utilizadores</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditUser(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Novo Utilizador</Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" aria-describedby="dialog-desc"><p id="dialog-desc" className="hidden">Formulário</p>
            <DialogHeader><DialogTitle className="text-gray-900 dark:text-white">{editUser ? "Editar Utilizador" : "Novo Utilizador"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label className="text-gray-700 dark:text-gray-300">Nome</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
              <div><Label className="text-gray-700 dark:text-gray-300">Email</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              {!editUser && <div><Label className="text-gray-700 dark:text-gray-300">Senha</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="password" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} /></div>}
              {editUser && <div><Label className="text-gray-700 dark:text-gray-300">Nova Senha (opcional)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="password" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} /></div>}
              <div><Label className="text-gray-700 dark:text-gray-300">Nível</Label>
                <Select value={form.nivel} onValueChange={(v: any) => setForm({...form, nivel: v})}>
                  <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {session?.user.nivel === "SUPER_ADMIN" && <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>}
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="GERENTE">Gerente</SelectItem>
                    <SelectItem value="TECNICO">Técnico</SelectItem>
                    <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>{editUser ? "Guardar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader><CardTitle className="text-gray-900 dark:text-white">Utilizadores do Sistema</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-600 dark:text-gray-400">Foto</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Nome</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Email</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Nível</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map(u => (
                <TableRow key={u.id} className="border-gray-200 dark:border-gray-700">
                  <TableCell>
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.nome}
                        className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => setZoomedAvatar(u.avatar ?? null)}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{u.nome}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{u.email}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{u.nivel}</TableCell>
                  <TableCell className="space-x-2">
                    {podeEditar(u) && (
                      <>
                        <Button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300" size="sm" variant="outline" onClick={() => { setEditUser(u); setForm({ nome: u.nome, email: u.email, senha: "", nivel: u.nivel as any }); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button className="bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-300" size="sm" variant="outline" onClick={() => handleDelete(u.id)} disabled={u.id === session?.user.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Zoom para Avatar */}
      {zoomedAvatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setZoomedAvatar(null)}
        >
          <img
            src={zoomedAvatar}
            alt="Avatar"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700"
            onClick={() => setZoomedAvatar(null)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
