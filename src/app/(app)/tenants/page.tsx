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
import { Plus, Building } from "lucide-react";

export default function TenantsPage() {
  const { data: session } = useSession();
  const [tenants, setTenants] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nomeEmpresa: "", emailAdmin: "", nomeAdmin: "", senhaAdmin: "", plano: "STARTER" });

  useEffect(() => {
    if (!session || session.user.nivel !== "SUPER_ADMIN") return;
    fetch("/api/tenants").then(r => r.json()).then(setTenants);
  }, [session]);

  const handleCreate = async () => {
    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ nomeEmpresa: "", emailAdmin: "", nomeAdmin: "", senhaAdmin: "", plano: "STARTER" });
      fetch("/api/tenants").then(r => r.json()).then(setTenants);
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao criar empresa");
    }
  };

  if (session?.user.nivel !== "SUPER_ADMIN") {
    return <div className="p-6">Acesso restrito ao SUPER_ADMIN.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Empresas</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent aria-describedby="tenant-form-desc">
            <DialogHeader><DialogTitle>Criar Empresa</DialogTitle></DialogHeader>
            <p id="tenant-form-desc" className="hidden">Formulário de criação de empresa</p>
            <div className="grid gap-4">
              <div><Label>Nome da Empresa</Label><Input value={form.nomeEmpresa} onChange={e => setForm({...form, nomeEmpresa: e.target.value})} /></div>
              <div><Label>Plano</Label>
                <Select value={form.plano} onValueChange={v => setForm({...form, plano: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTER">STARTER</SelectItem>
                    <SelectItem value="PROFISSIONAL">PROFISSIONAL</SelectItem>
                    <SelectItem value="BUSINESS">BUSINESS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t pt-4 mt-2"><p className="font-semibold mb-4">Administrador da Empresa</p></div>
              <div><Label>Nome do Admin</Label><Input value={form.nomeAdmin} onChange={e => setForm({...form, nomeAdmin: e.target.value})} /></div>
              <div><Label>Email do Admin</Label><Input type="email" value={form.emailAdmin} onChange={e => setForm({...form, emailAdmin: e.target.value})} /></div>
              <div><Label>Password do Admin</Label><Input type="password" value={form.senhaAdmin} onChange={e => setForm({...form, senhaAdmin: e.target.value})} /></div>
              <Button onClick={handleCreate} className="bg-green-600">Criar Empresa e Admin</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Empresas Registadas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Nome</TableHead><TableHead>Plano</TableHead><TableHead>Utilizadores</TableHead><TableHead>Clientes</TableHead><TableHead>Ordens</TableHead><TableHead>Estado</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell><Badge variant="outline">{t.plano}</Badge></TableCell>
                  <TableCell>{t._count?.usuarios || 0}</TableCell>
                  <TableCell>{t._count?.clientes || 0}</TableCell>
                  <TableCell>{t._count?.ordens || 0}</TableCell>
                  <TableCell><Badge className={t.ativo ? "bg-green-600" : "bg-red-600"}>{t.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
