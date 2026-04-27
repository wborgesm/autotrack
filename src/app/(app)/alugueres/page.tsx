"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AlugueresPage() {
  const { data: session } = useSession();
  const [alugueres, setAlugueres] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ clienteId: "", veiculoId: "", dataInicio: "", dataFim: "", valorDiaria: "", observacoes: "" });

  useEffect(() => {
    if (!session) return;
    fetch("/api/alugueres").then(r => r.json()).then(setAlugueres);
    fetch("/api/clientes?limit=100").then(r => r.json()).then(d => setClientes(d.data || []));
    fetch("/api/veiculos").then(r => r.json()).then(setVeiculos);
  }, [session]);

  const handleCreate = async () => {
    const res = await fetch("/api/alugueres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, valorDiaria: parseFloat(form.valorDiaria) }),
    });
    if (res.ok) { setDialogOpen(false); fetch("/api/alugueres").then(r => r.json()).then(setAlugueres); }
  };

  const handleFinalizar = async (id: string) => {
    await fetch(`/api/alugueres/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "FINALIZADO", dataFim: new Date().toISOString() }),
    });
    fetch("/api/alugueres").then(r => r.json()).then(setAlugueres);
  };

  const handleCancelar = async (id: string) => {
    await fetch(`/api/alugueres/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELADO" }),
    });
    fetch("/api/alugueres").then(r => r.json()).then(setAlugueres);
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "ATIVO": return <Badge className="bg-green-600">Ativo</Badge>;
      case "FINALIZADO": return <Badge className="bg-blue-600">Finalizado</Badge>;
      case "CANCELADO": return <Badge className="bg-red-600">Cancelado</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Car className="h-6 w-6" /> Aluguer de Veículos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Novo Aluguer</Button></DialogTrigger>
          <DialogContent aria-describedby="aluguer-desc">
            <DialogHeader><DialogTitle>Novo Aluguer</DialogTitle></DialogHeader>
            <p id="aluguer-desc" className="hidden">Formulário</p>
            <div className="grid gap-4">
              <div><Label>Cliente</Label><Select onValueChange={v => setForm({...form, clienteId: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Veículo</Label><Select onValueChange={v => setForm({...form, veiculoId: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{veiculos.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data Início</Label><Input type="datetime-local" value={form.dataInicio} onChange={e => setForm({...form, dataInicio: e.target.value})} /></div>
                <div><Label>Data Fim (prevista)</Label><Input type="datetime-local" value={form.dataFim} onChange={e => setForm({...form, dataFim: e.target.value})} /></div>
              </div>
              <div><Label>Valor Diária (€)</Label><Input type="number" step="0.01" value={form.valorDiaria} onChange={e => setForm({...form, valorDiaria: e.target.value})} /></div>
              <div><Label>Observações</Label><Input value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} /></div>
              <Button onClick={handleCreate} className="bg-green-600">Criar Aluguer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader><CardTitle>Alugueres</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Cliente</TableHead><TableHead>Veículo</TableHead><TableHead>Início</TableHead><TableHead>Valor Dia</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Ações</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {alugueres.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{a.cliente?.nome}</TableCell>
                  <TableCell>{a.veiculo?.placa} {a.veiculo?.modelo}</TableCell>
                  <TableCell>{formatDate(a.dataInicio)}</TableCell>
                  <TableCell>{formatCurrency(a.valorDiaria)}</TableCell>
                  <TableCell>{a.valorTotal ? formatCurrency(a.valorTotal) : "—"}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell>
                    {a.status === "ATIVO" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="bg-green-50" onClick={() => handleFinalizar(a.id)}><CheckCircle className="h-4 w-4 mr-1" /> Finalizar</Button>
                        <Button size="sm" variant="outline" className="bg-red-50" onClick={() => handleCancelar(a.id)}><XCircle className="h-4 w-4 mr-1" /> Cancelar</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
