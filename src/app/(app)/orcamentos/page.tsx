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

export default function OrcamentosPage() {
  const { data: session } = useSession();
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [pecas, setPecas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itens, setItens] = useState<any[]>([]);
  const [novoItem, setNovoItem] = useState({ tipo: "SERVICO", id: "", quantidade: 1 });
  const [form, setForm] = useState({ clienteId: "", veiculoId: "", descricao: "" });

  const fetchData = async () => {
    try {
      const [orcRes, cliRes, veiRes, servRes, pecRes] = await Promise.all([
        fetch("/api/orcamentos"),
        fetch("/api/clientes?limit=100"),
        fetch("/api/veiculos?limit=200"),
        fetch("/api/servicos"),
        fetch("/api/estoque"),
      ]);
      const orcData = await orcRes.json();
      const cliData = await cliRes.json();
      const veiData = await veiRes.json();
      const servData = await servRes.json();
      const pecData = await pecRes.json();
      setOrcamentos(Array.isArray(orcData.data) ? orcData.data : []);
      setClientes(Array.isArray(cliData.data) ? cliData.data : []);
      setVeiculos(Array.isArray(veiData) ? veiData : []);
      setServicos(Array.isArray(servData) ? servData : []);
      setPecas(Array.isArray(pecData.pecas) ? pecData.pecas : []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  useEffect(() => { if (session) fetchData(); }, [session]);

  const veiculosFiltrados = form.clienteId
    ? veiculos.filter((v: any) => v.clienteId === form.clienteId && v.ativo)
    : [];

  const adicionarItem = () => {
    if (!novoItem.id) return;
    const item = novoItem.tipo === "SERVICO"
      ? servicos.find((s: any) => s.id === novoItem.id)
      : pecas.find((p: any) => p.id === novoItem.id);
    if (!item) return;
    const valorUnit = novoItem.tipo === "SERVICO" ? Number(item.precoMaoObra) || 0 : Number(item.custoPadrao) || 0;
    const quantidade = novoItem.quantidade;
    setItens([...itens, {
      tipo: novoItem.tipo,
      servicoId: novoItem.tipo === "SERVICO" ? item.id : null,
      pecaId: novoItem.tipo === "PECA" ? item.id : null,
      nome: item.nome,
      quantidade: quantidade,
      valorUnit: valorUnit,
      desconto: 0,
    }]);
    setNovoItem({ tipo: "SERVICO", id: "", quantidade: 1 });
  };

  const handleSave = async () => {
    const res = await fetch("/api/orcamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, itens }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("Erro ao guardar:", err);
      return;
    }
    setDialogOpen(false);
    setItens([]);
    setForm({ clienteId: "", veiculoId: "", descricao: "" });
    fetchData();
  };

  const podeConverter = (o: any) => o.clienteId && o.veiculoId;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4"/>Novo Orçamento</Button></DialogTrigger>
          <DialogContent aria-describedby="orcamento-desc" className="max-w-3xl">
            <p id="orcamento-desc" className="hidden">Formulário de orçamento</p>
            <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label>Cliente</Label>
                <Select onValueChange={v => setForm({...form, clienteId: v === "__none__" ? "" : v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.clienteId && (
                <div>
                  <Label>Veículo</Label>
                  <Select value={form.veiculoId} onValueChange={v => setForm({...form, veiculoId: v === "__none__" ? "" : v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione (opcional)"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {veiculosFiltrados.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Descrição</Label><Input value={form.descricao} onChange={e=>setForm({...form, descricao: e.target.value})}/></div>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div><Label>Tipo</Label>
                  <Select value={novoItem.tipo} onValueChange={(v: string) => setNovoItem({...novoItem, tipo: v, id: ""})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="SERVICO">Serviço</SelectItem><SelectItem value="PECA">Peça</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>{novoItem.tipo === "SERVICO" ? "Serviço" : "Peça"}</Label>
                  <Select value={novoItem.id} onValueChange={(v: string) => setNovoItem({...novoItem, id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                    <SelectContent>
                      {(novoItem.tipo === "SERVICO" ? servicos : pecas).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <div><Label>Qtd</Label><Input className="w-20" type="number" min="1" value={novoItem.quantidade} onChange={e=>setNovoItem({...novoItem, quantidade: parseInt(e.target.value) || 1})}/></div>
                  <Button className="bg-blue-600 mt-6" onClick={adicionarItem}>+</Button>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {itens.map((item: any, idx: number) => <div key={idx} className="flex justify-between text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded"><span>{item.nome} x{item.quantidade}</span><span>{formatCurrency(item.quantidade * item.valorUnit - item.desconto)}</span></div>)}
              </div>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Guardar Orçamento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Lista de Orçamentos</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Cliente</TableHead><TableHead>Veículo</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Data</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
          <TableBody>{orcamentos.map((o: any) => <TableRow key={o.id}><TableCell>#{o.numero}</TableCell><TableCell>{o.cliente?.nome || "—"}</TableCell><TableCell>{o.veiculo?.placa || "—"}</TableCell><TableCell>{formatCurrency(o.total)}</TableCell><TableCell>{o.status}</TableCell><TableCell>{formatDate(o.createdAt)}</TableCell><TableCell>
            <Link href={`/orcamentos/${o.id}`}><Button size="sm" variant="outline" className="mr-2"><Eye className="h-4 w-4"/></Button></Link>
            {podeConverter(o) && (
              <Button size="sm" variant="outline" className="bg-green-700 border-green-600 text-white" onClick={async () => {
                const res = await fetch(`/api/orcamentos/${o.id}/converter`, { method: "POST" });
                if (res.ok) {
                  const data = await res.json();
                  window.location.href = `/ordens/${data.id}`;
                } else {
                  const err = await res.json();
                  alert(err.error || "Erro ao converter");
                }
              }}>Converter em OS</Button>
            )}
          </TableCell></TableRow>)}</TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
