"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ServicosPage() {
  const { data: session } = useSession();
  const [servicos, setServicos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", precoMaoObra: "", tempoEstMin: "" });

  const fetchServicos = async () => {
    const res = await fetch("/api/servicos");
    setServicos(await res.json());
  };

  useEffect(() => { if (session) fetchServicos(); }, [session]);

  const handleSubmit = async () => {
    await fetch("/api/servicos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({...form, precoMaoObra: parseFloat(form.precoMaoObra), tempoEstMin: form.tempoEstMin?parseInt(form.tempoEstMin):null}) });
    setDialogOpen(false); setForm({ nome: "", descricao: "", precoMaoObra: "", tempoEstMin: "" }); fetchServicos();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Serviços</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/>Novo Serviço</Button></DialogTrigger>
          <DialogContent aria-describedby={undefined} aria-describedby="dialog-desc"><p id="dialog-desc" class="hidden">Formulário</p><DialogHeader><DialogTitle>Novo Serviço</DialogTitle></DialogHeader>
          <div className="grid gap-4"><div><Label>Nome</Label><Input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></div>
          <div><Label>Descrição</Label><Input value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/></div>
          <div><Label>Preço Mão de Obra (R$)</Label><Input type="number" step="0.01" value={form.precoMaoObra} onChange={e=>setForm({...form,precoMaoObra:e.target.value})}/></div>
          <div><Label>Tempo Estimado (min)</Label><Input type="number" value={form.tempoEstMin} onChange={e=>setForm({...form,tempoEstMin:e.target.value})}/></div>
          <Button onClick={handleSubmit}>Guardar</Button></div></DialogContent>
        </Dialog>
      </div>
      <Card><CardHeader><CardTitle>Catálogo de Serviços</CardTitle></CardHeader>
      <CardContent><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead>Preço</TableHead><TableHead>Tempo (min)</TableHead></TableRow></TableHeader>
      <TableBody>{servicos.map(s=>(<TableRow key={s.id}><TableCell>{s.nome}</TableCell><TableCell>{s.descricao}</TableCell><TableCell>{formatCurrency(s.precoMaoObra)}</TableCell><TableCell>{s.tempoEstMin||"-"}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>
  );
}
