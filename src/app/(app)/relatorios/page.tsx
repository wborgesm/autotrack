"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Download, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RelatoriosPage() {
  const { data: session } = useSession();
  const [tipo, setTipo] = useState("resumo");
  const [inicio, setInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [fim, setFim] = useState(new Date().toISOString().slice(0, 10));
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRelatorio = async () => {
    setLoading(true);
    const res = await fetch(`/api/relatorios?tipo=${tipo}&inicio=${inicio}&fim=${fim}`);
    const data = await res.json();
    setDados(data);
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchRelatorio();
  }, [session, tipo, inicio, fim]);

  const exportarCSV = () => {
    if (!dados) return;
    let csv = "";
    const linhas: any[] = [];

    if (tipo === "ordens") {
      csv = "Número,Cliente,Veículo,Data Entrada,Status,Total\n";
      dados.forEach((o: any) => {
        linhas.push(`${o.numero},"${o.cliente.nome}","${o.veiculo.modelo} - ${o.veiculo.placa}",${formatDate(o.dataEntrada)},${o.status},${o.total}`);
      });
    } else if (tipo === "faturamento") {
      csv = "Mês,Receita,Despesa,Lucro,Quantidade OS\n";
      dados.forEach((f: any) => {
        linhas.push(`${f.mes},${f.receita},${f.despesa},${f.lucro},${f.qtdOrdens}`);
      });
    } else if (tipo === "tecnicos") {
      csv = "Técnico,Especialidade,Total OS,Finalizadas,Faturamento,Tempo Médio (h)\n";
      dados.forEach((t: any) => {
        linhas.push(`"${t.tecnico}","${t.especialidade || ""}",${t.totalOrdens},${t.ordensFinalizadas},${t.faturamento},${t.tempoMedioHoras.toFixed(2)}`);
      });
    } else if (tipo === "clientes") {
      csv = "Cliente,Telefone,Email,Total Gasto,Quantidade OS\n";
      dados.forEach((c: any) => {
        linhas.push(`"${c.nome}","${c.telefone || ""}","${c.email || ""}",${c.totalGasto},${c._count.ordens}`);
      });
    } else if (tipo === "stock") {
      csv = "Data,Peça,Tipo,Quantidade\n";
      dados.movimentos.forEach((m: any) => {
        linhas.push(`${formatDate(m.createdAt)},"${m.peca.nome}",${m.tipo},${m.quantidade}`);
      });
    } else {
      csv = "Indicador,Valor\n";
      linhas.push(`Total de Ordens,${dados.totalOrdens}`);
      linhas.push(`Total de Clientes,${dados.totalClientes}`);
      linhas.push(`Faturamento,${dados.faturamento}`);
      dados.topServicos.forEach((s: any, i: number) => {
        linhas.push(`Top ${i+1} Serviço,${s.nome} (${s.quantidade})`);
      });
    }

    csv += linhas.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${tipo}_${inicio}_${fim}.csv`;
    link.click();
  };

  const renderTabela = () => {
    if (!dados) return <p className="text-gray-500">Nenhum dado encontrado.</p>;

    if (tipo === "ordens") {
      return (
        <Table>
          <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Cliente</TableHead><TableHead>Veículo</TableHead><TableHead>Entrada</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {dados.map((o: any) => (
              <TableRow key={o.id}><TableCell>{o.numero}</TableCell><TableCell>{o.cliente.nome}</TableCell><TableCell>{o.veiculo.modelo} - {o.veiculo.placa}</TableCell><TableCell>{formatDate(o.dataEntrada)}</TableCell><TableCell>{o.status}</TableCell><TableCell>{formatCurrency(o.total)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tipo === "faturamento") {
      return (
        <Table>
          <TableHeader><TableRow><TableHead>Mês</TableHead><TableHead>Receita</TableHead><TableHead>Despesa</TableHead><TableHead>Lucro</TableHead><TableHead>Qtd OS</TableHead></TableRow></TableHeader>
          <TableBody>
            {dados.map((f: any, i: number) => (
              <TableRow key={i}><TableCell>{f.mes}</TableCell><TableCell>{formatCurrency(f.receita)}</TableCell><TableCell>{formatCurrency(f.despesa)}</TableCell><TableCell>{formatCurrency(f.lucro)}</TableCell><TableCell>{f.qtdOrdens}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tipo === "tecnicos") {
      return (
        <Table>
          <TableHeader><TableRow><TableHead>Técnico</TableHead><TableHead>Especialidade</TableHead><TableHead>Total OS</TableHead><TableHead>Finalizadas</TableHead><TableHead>Faturamento</TableHead><TableHead>Tempo Médio (h)</TableHead></TableRow></TableHeader>
          <TableBody>
            {dados.map((t: any) => (
              <TableRow key={t.tecnico}><TableCell>{t.tecnico}</TableCell><TableCell>{t.especialidade || "-"}</TableCell><TableCell>{t.totalOrdens}</TableCell><TableCell>{t.ordensFinalizadas}</TableCell><TableCell>{formatCurrency(t.faturamento)}</TableCell><TableCell>{t.tempoMedioHoras.toFixed(2)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tipo === "clientes") {
      return (
        <Table>
          <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Telefone</TableHead><TableHead>Email</TableHead><TableHead>Total Gasto</TableHead><TableHead>Qtd OS</TableHead></TableRow></TableHeader>
          <TableBody>
            {dados.map((c: any) => (
              <TableRow key={c.id}><TableCell>{c.nome}</TableCell><TableCell>{c.telefone || "-"}</TableCell><TableCell>{c.email || "-"}</TableCell><TableCell>{formatCurrency(c.totalGasto)}</TableCell><TableCell>{c._count.ordens}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tipo === "stock") {
      return (
        <>
          <h3 className="font-semibold mb-2">Movimentações</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Peça</TableHead><TableHead>Tipo</TableHead><TableHead>Quantidade</TableHead></TableRow></TableHeader>
            <TableBody>
              {dados.movimentos.map((m: any) => (
                <TableRow key={m.id}><TableCell>{formatDate(m.createdAt)}</TableCell><TableCell>{m.peca.nome}</TableCell><TableCell>{m.tipo}</TableCell><TableCell>{m.quantidade}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
          <h3 className="font-semibold mt-4 mb-2">Peças Críticas</h3>
          <ul className="list-disc pl-5">
            {dados.pecasCriticas.map((p: any) => <li key={p.id}>{p.nome} (Stock: {p.qtdStock})</li>)}
          </ul>
        </>
      );
    }

    // Resumo
    return (
      <div className="space-y-2">
        <p><strong>Total de Ordens:</strong> {dados.totalOrdens}</p>
        <p><strong>Total de Clientes (no período):</strong> {dados.totalClientes}</p>
        <p><strong>Faturamento:</strong> {formatCurrency(dados.faturamento)}</p>
        <p><strong>Top 5 Serviços:</strong></p>
        <ul className="list-disc pl-5">
          {dados.topServicos.map((s: any, i: number) => (
            <li key={i}>{s.nome}: {s.quantidade} execuções</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRelatorio} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <Button onClick={exportarCSV} disabled={!dados}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label>Tipo de Relatório</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resumo">Resumo</SelectItem>
                  <SelectItem value="ordens">Ordens de Serviço</SelectItem>
                  <SelectItem value="faturamento">Faturamento</SelectItem>
                  <SelectItem value="tecnicos">Produtividade Técnicos</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="clientes">Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>A carregar...</p> : renderTabela()}
        </CardContent>
      </Card>
    </div>
  );
}
