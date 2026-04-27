"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tipo: "RECEITA", descricao: "", valor: "", data: new Date().toISOString().slice(0, 10), categoria: "" });

  const fetchData = async () => {
    const res = await fetch("/api/financeiro");
    const data = await res.json();
    setLancamentos(data.lancamentos || []);
    setResumo(data.resumo || { totalReceita: 0, totalDespesa: 0, lucro: 0, margem: 0 });
  };

  useEffect(() => { if (session) fetchData(); }, [session]);

  const handleSave = async () => {
    await fetch("/api/financeiro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, valor: parseFloat(form.valor) }),
    });
    setDialogOpen(false);
    setForm({ tipo: "RECEITA", descricao: "", valor: "", data: new Date().toISOString().slice(0, 10), categoria: "" });
    fetchData();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Novo Lançamento</Button>
            </DialogTrigger>
            <DialogContent aria-describedby="lancamento-form-desc" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <p id="lancamento-form-desc" className="hidden">Formulário de lançamento</p>
              <DialogHeader><DialogTitle className="text-gray-900 dark:text-white">Novo Lançamento</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div><Label className="text-gray-700 dark:text-gray-300">Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                    <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="RECEITA">Receita</SelectItem>
                      <SelectItem value="DESPESA">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-gray-700 dark:text-gray-300">Descrição</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Valor (€)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" step="0.01" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Data</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Categoria</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} /></div>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2"><CardTitle className="text-emerald-700 dark:text-emerald-300">Receitas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(resumo.totalReceita)}</p></CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2"><CardTitle className="text-red-700 dark:text-red-300">Despesas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(resumo.totalDespesa)}</p></CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2"><CardTitle className="text-blue-700 dark:text-blue-300">Lucro</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(resumo.lucro)}</p></CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader><CardTitle className="text-gray-900 dark:text-white">Lançamentos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-600 dark:text-gray-400">Tipo</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Descrição</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Valor</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Data</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Categoria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map(l => (
                <TableRow key={l.id} className="border-gray-200 dark:border-gray-700">
                  <TableCell><Badge className={l.tipo === "RECEITA" ? "bg-emerald-600" : "bg-red-600"}>{l.tipo}</Badge></TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{l.descricao}</TableCell>
                  <TableCell className={`font-medium ${l.tipo === "RECEITA" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(l.valor)}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{formatDate(l.data)}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{l.categoria || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
