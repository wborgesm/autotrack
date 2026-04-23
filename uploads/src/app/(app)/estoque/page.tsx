"use client";

import { useState, useEffect, useRef } from "react";
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
import { Plus, Package, RefreshCw, AlertTriangle, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Peca {
  id: string;
  codigo: string;
  nome: string;
  categoria?: string;
  unidade: string;
  qtdEstoque: number;
  qtdMinima: number;
  custoPadrao?: number;
  precoVenda?: number;
  margemLucro?: number;
  imagem?: string;
}

export default function EstoquePage() {
  const { data: session } = useSession();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [selectedPeca, setSelectedPeca] = useState<Peca | null>(null);
  const [newPeca, setNewPeca] = useState({
    codigo: "",
    nome: "",
    categoria: "",
    unidade: "UN",
    qtdEstoque: "",
    qtdMinima: "",
    custoPadrao: "",
    precoVenda: "",
    imagem: "",
  });
  const [movimentacao, setMovimentacao] = useState({
    pecaId: "",
    tipo: "ENTRADA" as "ENTRADA" | "SAIDA" | "AJUSTE",
    quantidade: "",
    custo: "",
    observacoes: "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPecas = async () => {
    const res = await fetch("/api/estoque");
    const data = await res.json();
    setPecas(data.pecas);
    setCategorias(data.categorias);
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchPecas();
  }, [session]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewPeca(prev => ({ ...prev, imagem: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Erro no upload");
      const data = await res.json();
      setNewPeca(prev => ({ ...prev, imagem: data.url }));
    } catch (error) {
      alert("Erro ao enviar imagem.");
      setNewPeca(prev => ({ ...prev, imagem: "" }));
    } finally {
      setUploading(false);
    }
  };

  const handleSavePeca = async () => {
    const payload: any = {
      codigo: newPeca.codigo,
      nome: newPeca.nome,
      categoria: newPeca.categoria || undefined,
      unidade: newPeca.unidade,
    };

    const qtdEstoque = parseFloat(newPeca.qtdEstoque);
    if (!isNaN(qtdEstoque)) payload.qtdEstoque = qtdEstoque;

    const qtdMinima = parseFloat(newPeca.qtdMinima);
    if (!isNaN(qtdMinima)) payload.qtdMinima = qtdMinima;

    const custoPadrao = parseFloat(newPeca.custoPadrao);
    if (!isNaN(custoPadrao)) payload.custoPadrao = custoPadrao;

    const precoVenda = parseFloat(newPeca.precoVenda);
    if (!isNaN(precoVenda)) payload.precoVenda = precoVenda;

    if (newPeca.imagem) payload.imagem = newPeca.imagem;

    const res = await fetch("/api/estoque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setDialogOpen(false);
      fetchPecas();
      setNewPeca({ codigo: "", nome: "", categoria: "", unidade: "UN", qtdEstoque: "", qtdMinima: "", custoPadrao: "", precoVenda: "", imagem: "" });
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao guardar");
    }
  };

  const handleMovimentar = async () => {
    if (!selectedPeca) return;
    const payload: any = {
      pecaId: selectedPeca.id,
      tipo: movimentacao.tipo,
      observacoes: movimentacao.observacoes,
    };
    const quantidade = parseFloat(movimentacao.quantidade);
    if (!isNaN(quantidade)) payload.quantidade = quantidade;
    const custo = parseFloat(movimentacao.custo);
    if (!isNaN(custo)) payload.custo = custo;

    const res = await fetch("/api/estoque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMovDialogOpen(false);
      fetchPecas();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const pecasCriticas = pecas.filter(p => p.qtdEstoque <= p.qtdMinima);
  const nivel = session?.user?.nivel;
  const podeEditar = nivel === "ADMIN" || nivel === "GERENTE";

  if (loading) return <div className="p-6">A carregar...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Stock</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPecas}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
          {podeEditar && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Nova Peça</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl" aria-describedby={undefined}>
                <DialogHeader><DialogTitle>Cadastrar Peça</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Código</Label><Input value={newPeca.codigo} onChange={e => setNewPeca({...newPeca, codigo: e.target.value})} /></div>
                    <div><Label>Nome</Label><Input value={newPeca.nome} onChange={e => setNewPeca({...newPeca, nome: e.target.value})} /></div>
                    <div><Label>Categoria</Label><Input value={newPeca.categoria} onChange={e => setNewPeca({...newPeca, categoria: e.target.value})} /></div>
                    <div><Label>Unidade</Label>
                      <Select value={newPeca.unidade} onValueChange={v => setNewPeca({...newPeca, unidade: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["UN","KG","L","M","PAR"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Quantidade Inicial</Label><Input type="number" value={newPeca.qtdEstoque} onChange={e => setNewPeca({...newPeca, qtdEstoque: e.target.value})} /></div>
                    <div><Label>Stock Mínimo</Label><Input type="number" value={newPeca.qtdMinima} onChange={e => setNewPeca({...newPeca, qtdMinima: e.target.value})} /></div>
                    <div><Label>Preço de Custo (€)</Label><Input type="number" step="0.01" value={newPeca.custoPadrao} onChange={e => setNewPeca({...newPeca, custoPadrao: e.target.value})} /></div>
                    <div><Label>Preço de Venda (€)</Label><Input type="number" step="0.01" value={newPeca.precoVenda} onChange={e => setNewPeca({...newPeca, precoVenda: e.target.value})} /></div>
                    <div className="col-span-2">
                      <Label>Imagem</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {newPeca.imagem && <img src={newPeca.imagem} alt="Preview" className="h-16 w-16 object-cover rounded border" />}
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {newPeca.imagem ? "Alterar Imagem" : "Carregar Imagem"}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSavePeca}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {pecasCriticas.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2"><CardTitle className="text-red-800 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Peças com stock baixo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pecasCriticas.map(p => (<Badge key={p.id} variant="destructive">{p.nome} ({p.qtdEstoque} {p.unidade})</Badge>))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Peças em Stock</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Imagem</TableHead><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Stock</TableHead><TableHead>Custo</TableHead><TableHead>Venda</TableHead><TableHead>Margem</TableHead>{podeEditar && <TableHead>Ações</TableHead>}</TableRow>
            </TableHeader>
            <TableBody>
              {pecas.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.imagem ? <img src={p.imagem} alt={p.nome} className="h-10 w-10 object-cover rounded" /> : <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>}</TableCell>
                  <TableCell>{p.codigo}</TableCell>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell className={p.qtdEstoque <= p.qtdMinima ? "text-red-600 font-bold" : ""}>{p.qtdEstoque} {p.unidade}</TableCell>
                  <TableCell>{formatCurrency(p.custoPadrao || 0)}</TableCell>
                  <TableCell>{formatCurrency(p.precoVenda || 0)}</TableCell>
                  <TableCell>{p.margemLucro ? `${p.margemLucro.toFixed(1)}%` : "-"}</TableCell>
                  {podeEditar && (
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedPeca(p); setMovDialogOpen(true); }}>Movimentar</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {podeEditar && (
        <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader><DialogTitle>Movimentar Stock - {selectedPeca?.nome}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Tipo</Label>
                <Select value={movimentacao.tipo} onValueChange={(v: any) => setMovimentacao({...movimentacao, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ENTRADA">Entrada</SelectItem><SelectItem value="SAIDA">Saída</SelectItem><SelectItem value="AJUSTE">Ajuste</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Quantidade</Label><Input type="number" value={movimentacao.quantidade} onChange={e => setMovimentacao({...movimentacao, quantidade: e.target.value})} /></div>
              {movimentacao.tipo !== "AJUSTE" && (<div><Label>Custo Unitário (€)</Label><Input type="number" step="0.01" value={movimentacao.custo} onChange={e => setMovimentacao({...movimentacao, custo: e.target.value})} /></div>)}
              <div><Label>Observações</Label><Input value={movimentacao.observacoes} onChange={e => setMovimentacao({...movimentacao, observacoes: e.target.value})} /></div>
              <Button onClick={handleMovimentar}>Confirmar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
