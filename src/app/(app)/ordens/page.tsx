"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BadgeEstado } from "@/components/ui/BadgeEstado";
import { Progress } from "@/components/ui/progress";
import { FiltrosTabela } from "@/components/ui/FiltrosTabela";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

const progressoPorEstado: Record<string, number> = {
  ABERTA: 10, EM_DIAGNOSTICO: 30, EM_EXECUCAO: 50, PRONTA: 85, ENTREGUE: 100, CANCELADA: 0,
};

export default function OrdensPage() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const debouncedPesquisa = useDebounce(pesquisa, 300);
  const [status, setStatus] = useState("TODAS");
  const [tecnico, setTecnico] = useState("TODOS");
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  useEffect(() => {
    fetch("/api/ordens").then(r => r.json()).then(d => setOrdens(d.ordens || d));
    fetch("/api/tecnicos").then(r => r.json()).then(d => setTecnicos(d));
  }, []);

  const filtradas = useMemo(() => {
    let lista = ordens;
    if (debouncedPesquisa) {
      const q = debouncedPesquisa.toLowerCase();
      lista = lista.filter(o => String(o.numero).includes(q) || o.cliente?.nome?.toLowerCase().includes(q) || o.veiculo?.placa?.toLowerCase().includes(q));
    }
    if (status !== "TODAS") lista = lista.filter(o => o.status === status);
    if (tecnico !== "TODOS") lista = lista.filter(o => o.tecnicoId === tecnico);
    return lista;
  }, [ordens, debouncedPesquisa, status, tecnico]);

  const totalPaginas = Math.ceil(filtradas.length / porPagina);
  const paginadas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
      <FiltrosTabela pesquisa={pesquisa} onPesquisaChange={setPesquisa} filtrosActivos={!!status || !!tecnico || !!pesquisa} onLimpar={() => { setStatus("TODAS"); setTecnico("TODOS"); setPesquisa(""); }}>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas</SelectItem>
            <SelectItem value="ABERTA">Aberta</SelectItem>
            <SelectItem value="EM_EXECUCAO">Em execução</SelectItem>
            <SelectItem value="PRONTA">Pronta</SelectItem>
            <SelectItem value="ENTREGUE">Entregue</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tecnico} onValueChange={setTecnico}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Técnico" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            {tecnicos.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </FiltrosTabela>

      <Card className="glass">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Data</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginadas.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono">#{o.numero}</TableCell>
                  <TableCell>{o.cliente?.nome}</TableCell>
                  <TableCell>{o.veiculo?.placa}</TableCell>
                  <TableCell><BadgeEstado estado={o.status} /></TableCell>
                  <TableCell className="w-[120px]"><Progress value={progressoPorEstado[o.status] || 0} className="h-2" /></TableCell>
                  <TableCell className="text-xs">{formatDate(o.createdAt)}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => window.location.href = `/ordens/${o.id}`}>Ver</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-3 border-t">
            <div className="text-sm text-gray-500">A mostrar {(pagina - 1) * porPagina + 1}-{Math.min(pagina * porPagina, filtradas.length)} de {filtradas.length}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)}>Próximo</Button>
              <Select value={String(porPagina)} onValueChange={v => { setPorPagina(Number(v)); setPagina(1); }}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
