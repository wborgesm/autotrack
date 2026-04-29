"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

const statusMap: Record<string, string> = {
  PENDENTE: "Pendente",
  RECEBIDA: "Recebida",
  CANCELADA: "Cancelada",
};

const statusColor: Record<string, string> = {
  PENDENTE: "bg-yellow-500",
  RECEBIDA: "bg-green-500",
  CANCELADA: "bg-red-500",
};

export default function EncomendasPage() {
  const { data: session } = useSession();
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [pesquisa, setPesquisa] = useState("");

  useEffect(() => {
    if (!session) return;
    fetch("/api/encomendas")
      .then(r => r.json())
      .then(data => setEncomendas(data.encomendas || data))
      .catch(() => setEncomendas([]))
      .finally(() => setLoading(false));
  }, [session]);

  const encomendasFiltradas = encomendas.filter((enc: any) => {
    if (filtroStatus !== "todas" && enc.status !== filtroStatus) return false;
    if (pesquisa) {
      const termo = pesquisa.toLowerCase();
      return (
        enc.descricao?.toLowerCase().includes(termo) ||
        enc.cliente?.nome?.toLowerCase().includes(termo) ||
        enc.id?.toLowerCase().includes(termo)
      );
    }
    return true;
  });

  if (!session) return <div className="p-6 text-center">A carregar sessão...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" /> Encomendas
        </h1>
        <Button onClick={() => window.location.href = "/encomendas/nova"} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" /> Nova Encomenda
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar encomenda..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os estados</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="RECEBIDA">Recebida</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">A carregar encomendas...</p>
          ) : encomendasFiltradas.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Nenhuma encomenda encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prevista</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encomendasFiltradas.map((enc: any) => (
                  <TableRow
                    key={enc.id}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => window.location.href = `/encomendas/${enc.id}`}
                  >
                    <TableCell className="text-xs">{formatDate(enc.createdAt)}</TableCell>
                    <TableCell className="text-xs font-medium">{enc.cliente?.nome || "—"}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{enc.descricao || "—"}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">
                        {enc.tipo === "ENCOMENDA_OFICINA" ? "Oficina" : "Cliente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{enc.dataPrevista ? formatDate(enc.dataPrevista) : "—"}</TableCell>
                    <TableCell className="text-xs">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${statusColor[enc.status] || "bg-gray-500"}`}>
                        {statusMap[enc.status] || enc.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {enc.valorTotal != null ? `€ ${Number(enc.valorTotal).toFixed(2)}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
