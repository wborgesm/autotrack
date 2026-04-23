"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Plus, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Lancamento {
  id: string;
  tipo: "RECEITA" | "DESPESA";
  descricao: string;
  valor: number;
  data: string;
  pago: boolean;
  categoria?: string;
  ordem?: { numero: number; cliente: { nome: string } };
}

export default function FinanceiroPage() {
  const { data: session } = useSession();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [resumo, setResumo] = useState({ totalReceita: 0, totalDespesa: 0, lucro: 0, margem: 0 });
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [newLancamento, setNewLancamento] = useState({
    tipo: "RECEITA" as "RECEITA" | "DESPESA",
    descricao: "",
    valor: "",
    categoria: "",
    data: new Date().toISOString().slice(0, 10),
    pago: false,
  });

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/financeiro?mes=${mesSelecionado}`);
    const data = await res.json();
    setLancamentos(data.lancamentos);
    setResumo(data.resumo);
    setHistorico(data.historico);
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session, mesSelecionado]);

  const handleSave = async () => {
    if (!newLancamento.descricao || !newLancamento.valor) {
      alert("Descrição e valor são obrigatórios.");
      return;
    }

    const valorNumerico = parseFloat(newLancamento.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert("Valor inválido. Insira um número positivo.");
      return;
    }

    const payload = {
      tipo: newLancamento.tipo,
      descricao: newLancamento.descricao,
      valor: valorNumerico,
      categoria: newLancamento.categoria || undefined,
      data: newLancamento.data ? new Date(newLancamento.data).toISOString() : undefined,
      pago: newLancamento.pago,
    };

    const res = await fetch("/api/financeiro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      fetchData();
      setNewLancamento({ tipo: "RECEITA", descricao: "", valor: "", categoria: "", data: new Date().toISOString().slice(0,10), pago: false });
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao guardar");
    }
  };

  const chartData = historico.map((item: any) => ({
    mes: new Date(item.mes + "-01").toLocaleDateString("pt-PT", { month: "short" }),
    receita: Number(item.receita) || 0,
    despesa: Number(item.despesa) || 0,
    lucro: (Number(item.receita) || 0) - (Number(item.despesa) || 0),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <div className="flex gap-2">
          <Input
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" onClick={fetchData}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Novo Lançamento</Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} aria-describedby="dialog-desc"><p id="dialog-desc" class="hidden">Formulário</p>
              <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div><Label>Tipo</Label>
                  <Select value={newLancamento.tipo} onValueChange={(v: any) => setNewLancamento({...newLancamento, tipo: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEITA">Receita</SelectItem>
                      <SelectItem value="DESPESA">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição</Label><Input value={newLancamento.descricao} onChange={e => setNewLancamento({...newLancamento, descricao: e.target.value})} /></div>
                <div><Label>Categoria (opcional)</Label><Input value={newLancamento.categoria} onChange={e => setNewLancamento({...newLancamento, categoria: e.target.value})} /></div>
                <div><Label>Valor (€)</Label><Input type="number" step="0.01" value={newLancamento.valor} onChange={e => setNewLancamento({...newLancamento, valor: e.target.value})} /></div>
                <div><Label>Data</Label><Input type="date" value={newLancamento.data} onChange={e => setNewLancamento({...newLancamento, data: e.target.value})} /></div>
                <div className="flex items-center gap-2"><input type="checkbox" checked={newLancamento.pago} onChange={e => setNewLancamento({...newLancamento, pago: e.target.checked})} /><Label>Pago</Label></div>
                <Button onClick={handleSave}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Receitas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(resumo.totalReceita)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-600">Despesas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(resumo.totalDespesa)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lucro</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${resumo.lucro >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatCurrency(resumo.lucro)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Margem</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{resumo.margem.toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Evolução (últimos 6 meses)</CardTitle></CardHeader>
        <CardContent><RevenueChart data={chartData} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lançamentos do Mês</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{formatDate(l.data)}</TableCell>
                  <TableCell>{l.descricao}</TableCell>
                  <TableCell>{l.categoria || "-"}</TableCell>
                  <TableCell className={l.tipo === "RECEITA" ? "text-green-600" : "text-red-600"}>
                    {l.tipo === "RECEITA" ? "+" : "-"} {formatCurrency(l.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.pago ? "default" : "secondary"}>{l.pago ? "Pago" : "Pendente"}</Badge>
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
