"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

export default function OrdensPage() {
  const { data: session } = useSession();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    clienteId: "",
    veiculoId: "",
    tecnicoId: "",
    kmEntrada: "",
    relatoCliente: "",
    dataPrevista: "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    const [oRes, cRes, vRes] = await Promise.all([
      fetch("/api/ordens"),
      fetch("/api/clientes?limit=100"),
      fetch("/api/veiculos"),
    ]);
    setOrdens((await oRes.json()).data);
    setClientes((await cRes.json()).data);
    setVeiculos(await vRes.json());
  };

  useEffect(() => { if (session) fetchData(); }, [session]);

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!form.clienteId || !form.veiculoId) {
      setErrorMsg("Cliente e veículo são obrigatórios.");
      return;
    }
    const payload: any = {
      clienteId: form.clienteId,
      veiculoId: form.veiculoId,
      tecnicoId: form.tecnicoId || undefined,
      kmEntrada: form.kmEntrada ? parseInt(form.kmEntrada) : undefined,
      relatoCliente: form.relatoCliente,
      dataPrevista: form.dataPrevista ? new Date(form.dataPrevista).toISOString() : undefined,
    };
    const res = await fetch("/api/ordens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ clienteId: "", veiculoId: "", tecnicoId: "", kmEntrada: "", relatoCliente: "", dataPrevista: "" });
      fetchData();
    } else {
      const err = await res.json();
      setErrorMsg(err.error || "Erro ao criar OS");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/>Nova OS</Button></DialogTrigger>
          <DialogContent className="max-w-2xl" aria-describedby="dialog-desc"><p id="dialog-desc" className="hidden">Formulário</p>
            <DialogHeader><DialogTitle>Nova Ordem de Serviço</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Cliente *</Label>
                <Select onValueChange={v => { setForm({...form, clienteId: v}); const veics = veiculos.filter(ve => ve.clienteId === v); if (veics.length === 1) setForm(f => ({...f, veiculoId: veics[0].id})); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Veículo *</Label>
                <Select value={form.veiculoId} onValueChange={v => setForm({...form, veiculoId: v})} disabled={!form.clienteId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{veiculos.filter(v => v.clienteId === form.clienteId).map(v => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>KM Entrada</Label><Input type="number" value={form.kmEntrada} onChange={e => setForm({...form, kmEntrada: e.target.value})} /></div>
              <div><Label>Data Prevista</Label><Input type="date" value={form.dataPrevista} onChange={e => setForm({...form, dataPrevista: e.target.value})} /></div>
              <div className="col-span-2"><Label>Relato do Cliente</Label><Input value={form.relatoCliente} onChange={e => setForm({...form, relatoCliente: e.target.value})} /></div>
            </div>
            {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
            <Button onClick={handleSubmit} className="mt-4">Criar OS</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardHeader><CardTitle>Ordens Recentes</CardTitle></CardHeader>
      <CardContent><Table><TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Cliente</TableHead><TableHead>Veículo</TableHead><TableHead>Entrada</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
      <TableBody>{ordens.map(o => (<TableRow key={o.id}><TableCell>#{o.numero}</TableCell><TableCell>{o.cliente?.nome}</TableCell><TableCell>{o.veiculo?.placa}</TableCell><TableCell>{formatDate(o.dataEntrada)}</TableCell><TableCell><Badge className={getStatusColor(o.status)}>{getStatusLabel(o.status)}</Badge></TableCell><TableCell>{formatCurrency(o.total)}</TableCell><TableCell><Link href={`/ordens/${o.id}`}><Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1"/>Ver</Button></Link></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>
  );
}
