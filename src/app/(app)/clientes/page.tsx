"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatNIF, formatPhone } from "@/lib/utils";

export default function ClientesPage() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", cpf: "", telefone: "", email: "", endereco: "", observacoes: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const fetchClientes = async () => {
    const res = await fetch("/api/clientes");
    const data = await res.json();
    setClientes(data.data || []);
  };

  useEffect(() => { if (session) fetchClientes(); }, [session]);

  const handleSubmit = async () => {
    const url = editId ? `/api/clientes/${editId}` : "/api/clientes";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setDialogOpen(false); setEditId(null);
    setForm({ nome: "", cpf: "", telefone: "", email: "", endereco: "", observacoes: "" });
    fetchClientes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Desativar cliente?")) return;
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    fetchClientes();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/>Novo Cliente</Button></DialogTrigger>
          <DialogContent aria-describedby="cliente-form-desc">
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Cliente</DialogTitle></DialogHeader>
            <p id="cliente-form-desc" className="text-sm text-gray-500 hidden">Formulário de cliente.</p>
            <div className="grid gap-4">
              <div><Label>Nome</Label><Input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})}/></div>
              <div><Label>NIF</Label><Input value={form.cpf} onChange={e=>setForm({...form, cpf:e.target.value})}/></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})}/></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/></div>
              <div><Label>Morada</Label><Input value={form.endereco} onChange={e=>setForm({...form, endereco:e.target.value})}/></div>
              <div><Label>Observações</Label><Input value={form.observacoes} onChange={e=>setForm({...form, observacoes:e.target.value})}/></div>
              <Button onClick={handleSubmit}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardHeader><CardTitle>Lista de Clientes</CardTitle></CardHeader>
      <CardContent>
        <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>NIF</TableHead><TableHead>Telefone</TableHead><TableHead>Email</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {clientes.map(c => (
            <TableRow key={c.id}>
              <TableCell>{c.nome}</TableCell>
              <TableCell>{formatNIF(c.cpf)}</TableCell>
              <TableCell>{formatPhone(c.telefone)}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditId(c.id);
                  setForm({
                    nome: c.nome,
                    cpf: c.cpf || "",
                    telefone: c.telefone || "",
                    email: c.email || "",
                    endereco: c.endereco || "",
                    observacoes: c.observacoes || ""
                  });
                  setDialogOpen(true);
                }}><Pencil className="h-4 w-4"/></Button>
                <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4"/></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </CardContent></Card>
    </div>
  );
}
