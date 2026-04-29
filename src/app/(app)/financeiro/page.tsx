"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function FinanceiroPage() {
  const [periodo, setPeriodo] = useState("este_mes");
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>({});

  useEffect(() => {
    fetch(`/api/financeiro?periodo=${periodo}`)
      .then(r => r.json())
      .then(d => {
        setTransacoes(d.transacoes || []);
        setResumo(d.resumo || {});
      });
  }, [periodo]);

  const grafico = (resumo.mensal || []).map((m: any) => ({ mes: m.mes, Receitas: m.receitas, Despesas: m.despesas }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="este_mes">Este mês</SelectItem>
            <SelectItem value="mes_anterior">Mês anterior</SelectItem>
            <SelectItem value="este_ano">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass"><CardContent className="p-4 text-center"><p className="text-sm">Receitas</p><p className="text-xl font-bold text-green-600">€ {resumo.receitas?.toLocaleString("pt-PT")}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4 text-center"><p className="text-sm">Despesas</p><p className="text-xl font-bold text-red-600">€ {resumo.despesas?.toLocaleString("pt-PT")}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4 text-center"><p className="text-sm">Lucro</p><p className={`text-xl font-bold ${resumo.lucro >= 0 ? "text-green-600" : "text-red-600"}`}>€ {resumo.lucro?.toLocaleString("pt-PT")}</p></CardContent></Card>
      </div>
      <Card className="glass"><CardContent className="p-4">
        <h3 className="font-semibold mb-4">Receitas vs Despesas (6 meses)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={grafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={v => `€ ${v}`} />
            <Tooltip formatter={(v: number) => v.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} />
            <Bar dataKey="Receitas" fill="#3b82f6" />
            <Bar dataKey="Despesas" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent></Card>
      <Card className="glass"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead></TableRow></TableHeader>
          <TableBody>
            {transacoes.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs">{new Date(t.data).toLocaleDateString("pt-PT")}</TableCell>
                <TableCell>{t.descricao}</TableCell>
                <TableCell className={t.tipo === "RECEITA" ? "text-green-600" : "text-red-600"}>
                  {t.tipo === "RECEITA" ? "+" : "-"} € {Number(t.valor).toLocaleString("pt-PT")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
