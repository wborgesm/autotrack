"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

  <dialog id="nova-peca-dialog" className="p-6 rounded-xl glass"><h2 className="text-lg font-bold mb-4">Nova Peça / Editar</h2><div className="grid grid-cols-2 gap-4"><Input placeholder="Nome" /><Input placeholder="Categoria" /><Input type="number" placeholder="Quantidade" /><Input type="number" placeholder="Preço" /></div><Button className="mt-4" onClick={() => alert("Funcionalidade em desenvolvimento")}>Guardar</Button></dialog>
export default function EstoquePage() {
  const [pecas, setPecas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("todos");

  const fetchData = () => {
    fetch("/api/estoque").then(r => r.json()).then(d => setPecas(d.pecas || d));
  };
  useEffect(() => { fetchData(); }, []);

  const filtradas = pecas.filter((p: any) => {
    if (filtro === "ok") return p.qtdEstoque > p.qtdMinima * 1.5;
    if (filtro === "baixo") return p.qtdEstoque > 0 && p.qtdEstoque <= p.qtdMinima;
    if (filtro === "zero") return p.qtdEstoque <= 0;
    return true;
  });

  const [edicao, setEdicao] = useState<any>(null);
  const editarPeca = (p: any) => setEdicao({ ...p });
  const ajustarQuantidade = async (id: string, delta: number) => {
    const original = pecas;
    setPecas(prev => prev.map(p => p.id === id ? { ...p, qtdEstoque: Math.max(0, p.qtdEstoque + delta) } : p));
    try {
      await fetch(`/api/estoque/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta }) });
    } catch {
      setPecas(original);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock</h1>
<Button variant="outline" size="sm" onClick={() => document.getElementById("nova-peca-dialog")?.showModal()}><Plus className="h-4 w-4 mr-1" /> Nova Peça</Button>
      <div className="flex gap-2">
        {["todos", "ok", "baixo", "zero"].map(tab => (
          <Button key={tab} variant={filtro === tab ? "default" : "outline"} size="sm" onClick={() => setFiltro(tab)}>
            {tab === "todos" ? "Todos" : tab === "ok" ? "OK" : tab === "baixo" ? "Baixo" : "Sem Stock"}
            {tab === "baixo" && <Badge variant="secondary" className="ml-1">{pecas.filter(p => p.qtdEstoque > 0 && p.qtdEstoque <= p.qtdMinima).length}</Badge>}
          </Button>
        ))}
      </div>
      <Card className="glass">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peça</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell>
                    <span className={cn("flex items-center gap-1", p.qtdEstoque <= p.qtdMinima && "text-red-600", p.qtdEstoque > p.qtdMinima && p.qtdEstoque <= p.qtdMinima * 1.5 && "text-amber-600")}>
                      {p.qtdEstoque <= p.qtdMinima ? <AlertTriangle className="h-4 w-4" /> : p.qtdEstoque <= p.qtdMinima * 1.5 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                      {p.qtdEstoque} un
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
<Button size="sm" variant="ghost" onClick={() => editarPeca(p)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" disabled={p.qtdEstoque <= 0} onClick={() => ajustarQuantidade(p.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => ajustarQuantidade(p.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
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
