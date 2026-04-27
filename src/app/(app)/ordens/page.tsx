"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrdensPage() {
  const { data: session } = useSession();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ clienteId: "", veiculoId: "", observacoes: "" });

  const fetchOrdens = () => {
    fetch("/api/ordens")
      .then(r => r.json())
      .then(d => setOrdens(Array.isArray(d) ? d : []))
      .catch(() => setOrdens([]));
  };
  const fetchClientes = () => fetch("/api/clientes?limit=100").then(r => r.json()).then(d => setClientes(Array.isArray(d.data) ? d.data : [])).catch(() => setClientes([]));
  const fetchVeiculos = () => fetch("/api/veiculos").then(r => r.json()).then(d => setVeiculos(Array.isArray(d) ? d : [])).catch(() => setVeiculos([]));

  useEffect(() => { if (session) { fetchOrdens(); fetchClientes(); fetchVeiculos(); } }, [session]);

  const handleCreate = async () => {
    const res = await fetch("/api/ordens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setDialogOpen(false); setForm({ clienteId: "", veiculoId: "", observacoes: "" }); fetchOrdens(); }
    else { const err = await res.json(); alert(err.error || "Erro"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4"/> Nova OS</Button></DialogTrigger>
          <DialogContent aria-describedby="ordens-form-desc">
            <p id="ordens-form-desc" className="hidden">Formulário de nova OS</p>
            <DialogHeader><DialogTitle>Nova Ordem de Serviço</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div><Label>Cliente</Label>
                <Select onValueChange={v => setForm({...form, clienteId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Veículo</Label>
                <Select onValueChange={v => setForm({...form, veiculoId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{veiculos.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Observações</Label><Input value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} /></div>
              <Button onClick={handleCreate} className="bg-green-600">Criar OS</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Lista de Ordens</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Cliente</TableHead><TableHead>Veículo</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {ordens.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>#{o.numero}</TableCell>
                  <TableCell>{o.cliente?.nome}</TableCell>
                  <TableCell>{o.veiculo?.placa}</TableCell>
                  <TableCell>{formatCurrency(o.total)}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                  <TableCell>
                    <Link href={`/ordens/${o.id}`}><Button size="sm" variant="outline"><Eye className="h-4 w-4"/></Button></Link>
                    {o.status !== "ENTREGUE" && o.status !== "CANCELADA" && (
                      <Button size="sm" variant="outline" className="ml-2 bg-green-700 text-white" onClick={async () => {
                        const res = await fetch(`/api/ordens/${o.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "PRONTA" }),
                        });
                        if (res.ok) fetchOrdens();
                      }}>Concluir</Button>
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
