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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPlaca } from "@/lib/utils";

export default function VeiculosPage() {
  const { data: session } = useSession();
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ clienteId: "", tipo: "CARRO", placa: "", marca: "", modelo: "", ano: "", cor: "", km: "" });

  const fetchData = async () => {
    const [vRes, cRes] = await Promise.all([fetch("/api/veiculos"), fetch("/api/clientes?limit=100")]);
    setVeiculos(await vRes.json());
    setClientes((await cRes.json()).data);
  };

  useEffect(() => { if (session) fetchData(); }, [session]);

  const handleSubmit = async () => {
    await fetch("/api/veiculos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({...form, ano: form.ano?parseInt(form.ano):undefined, km: form.km?parseInt(form.km):undefined}) });
    setDialogOpen(false); setForm({ clienteId: "", tipo: "CARRO", placa: "", marca: "", modelo: "", ano: "", cor: "", km: "" }); fetchData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Veículos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/>Novo Veículo</Button></DialogTrigger>
          <DialogContent className="max-w-2xl" aria-describedby="dialog-desc"><p id="dialog-desc" className="hidden">Formulário</p>
            <DialogHeader><DialogTitle>Novo Veículo</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Cliente</Label><Select onValueChange={v=>setForm({...form,clienteId:v})}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{clientes.map(c=><SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Tipo</Label><Select defaultValue="CARRO" onValueChange={v=>setForm({...form,tipo:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="CARRO">Carro</SelectItem><SelectItem value="MOTO">Moto</SelectItem><SelectItem value="UTILITARIO">Utilitário</SelectItem><SelectItem value="CAMINHAO">Caminhão</SelectItem></SelectContent></Select></div>
              <div><Label>Placa</Label><Input value={form.placa} onChange={e=>setForm({...form,placa:e.target.value.toUpperCase()})}/></div>
              <div><Label>Marca</Label><Input value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})}/></div>
              <div><Label>Modelo</Label><Input value={form.modelo} onChange={e=>setForm({...form,modelo:e.target.value})}/></div>
              <div><Label>Ano</Label><Input value={form.ano} onChange={e=>setForm({...form,ano:e.target.value})}/></div>
              <div><Label>Cor</Label><Input value={form.cor} onChange={e=>setForm({...form,cor:e.target.value})}/></div>
              <div><Label>KM Atual</Label><Input value={form.km} onChange={e=>setForm({...form,km:e.target.value})}/></div>
            </div>
            <Button onClick={handleSubmit} className="mt-4">Guardar</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardHeader><CardTitle>Frota</CardTitle></CardHeader>
      <CardContent><Table><TableHeader><TableRow><TableHead>Placa</TableHead><TableHead>Modelo</TableHead><TableHead>Cliente</TableHead><TableHead>Ano</TableHead></TableRow></TableHeader>
      <TableBody>{veiculos.map(v=>(<TableRow key={v.id}><TableCell>{formatPlaca(v.placa)}</TableCell><TableCell>{v.marca} {v.modelo}</TableCell><TableCell>{v.cliente?.nome}</TableCell><TableCell>{v.ano}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>
  );
}
