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
import { Plus, Package, RefreshCw, AlertTriangle, Upload, X, Pencil } from "lucide-react";
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
  codigoBarras?: string;
}

export default function EstoquePage() {
  const { data: session } = useSession();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [selectedPeca, setSelectedPeca] = useState<Peca | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [newPeca, setNewPeca] = useState({
    nome: "",
    categoria: "",
    unidade: "UN",
    qtdEstoque: "",
    qtdMinima: "",
    custoPadrao: "",
    precoVenda: "",
    imagem: "",
    codigoBarras: "",
  });
  
  const [editForm, setEditForm] = useState({
    codigo: "",
    nome: "",
    categoria: "",
    unidade: "UN",
    qtdEstoque: "",
    qtdMinima: "",
    custoPadrao: "",
    precoVenda: "",
    imagem: "",
    codigoBarras: "",
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (updater: any) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setter((prev: any) => ({ ...prev, imagem: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Erro no upload");
      const data = await res.json();
      setter((prev: any) => ({ ...prev, imagem: data.url }));
    } catch (error) {
      alert("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSavePeca = async () => {
    const payload: any = {
      nome: newPeca.nome,
      categoria: newPeca.categoria || undefined,
      unidade: newPeca.unidade,
      codigoBarras: newPeca.codigoBarras || undefined,
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
      setNewPeca({ nome: "", categoria: "", unidade: "UN", qtdEstoque: "", qtdMinima: "", custoPadrao: "", precoVenda: "", imagem: "", codigoBarras: "" });
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao guardar");
    }
  };

  const handleEditClick = (peca: Peca) => {
    setEditForm({
      codigo: peca.codigo,
      nome: peca.nome,
      categoria: peca.categoria || "",
      unidade: peca.unidade,
      qtdEstoque: peca.qtdEstoque.toString(),
      qtdMinima: peca.qtdMinima.toString(),
      custoPadrao: peca.custoPadrao?.toString() || "",
      precoVenda: peca.precoVenda?.toString() || "",
      imagem: peca.imagem || "",
      codigoBarras: peca.codigoBarras || "",
    });
    setSelectedPeca(peca);
    setEditDialogOpen(true);
  };

  const handleUpdatePeca = async () => {
    if (!selectedPeca) return;
    const payload: any = {
      nome: editForm.nome,
      categoria: editForm.categoria || undefined,
      unidade: editForm.unidade,
      codigoBarras: editForm.codigoBarras || undefined,
    };

    const qtdEstoque = parseFloat(editForm.qtdEstoque);
    if (!isNaN(qtdEstoque)) payload.qtdEstoque = qtdEstoque;

    const qtdMinima = parseFloat(editForm.qtdMinima);
    if (!isNaN(qtdMinima)) payload.qtdMinima = qtdMinima;

    const custoPadrao = parseFloat(editForm.custoPadrao);
    if (!isNaN(custoPadrao)) payload.custoPadrao = custoPadrao;

    const precoVenda = parseFloat(editForm.precoVenda);
    if (!isNaN(precoVenda)) payload.precoVenda = precoVenda;

    if (editForm.imagem) payload.imagem = editForm.imagem;

    const res = await fetch(`/api/estoque/${selectedPeca.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditDialogOpen(false);
      fetchPecas();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao atualizar");
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
  const podeEditar = nivel === "ADMIN" || nivel === "SUPER_ADMIN";

  if (loading) return <div className="p-6 text-gray-900 dark:text-gray-200">A carregar...</div>;

  return (
    <div className="p-6 space-y-6 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={fetchPecas}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
          {podeEditar && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Nova Peça</Button>
              </DialogTrigger>
              <DialogContent aria-describedby="peca-form-desc" className="max-w-3xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <p id="peca-form-desc" className="hidden">Formulário de cadastro de peça</p>
                <DialogHeader><DialogTitle className="text-gray-900 dark:text-white">Cadastrar Peça</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-gray-700 dark:text-gray-300">Nome</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={newPeca.nome} onChange={e => setNewPeca({...newPeca, nome: e.target.value})} /></div>
                    <div><Label className="text-gray-700 dark:text-gray-300">Categoria</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={newPeca.categoria} onChange={e => setNewPeca({...newPeca, categoria: e.target.value})} /></div>
                    <div><Label className="text-gray-700 dark:text-gray-300">Unidade</Label>
                      <Select value={newPeca.unidade} onValueChange={v => setNewPeca({...newPeca, unidade: v})}>
                        <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          {["UN","KG","L","M","PAR"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-gray-700 dark:text-gray-300">Quantidade Inicial</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" value={newPeca.qtdEstoque} onChange={e => setNewPeca({...newPeca, qtdEstoque: e.target.value})} /></div>
                    <div><Label className="text-gray-700 dark:text-gray-300">Stock Mínimo</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" value={newPeca.qtdMinima} onChange={e => setNewPeca({...newPeca, qtdMinima: e.target.value})} /></div>
                    <div><Label className="text-gray-700 dark:text-gray-300">Preço de Custo (€)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" step="0.01" value={newPeca.custoPadrao} onChange={e => setNewPeca({...newPeca, custoPadrao: e.target.value})} /></div>
                    <div><Label className="text-gray-700 dark:text-gray-300">Preço de Venda (€)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" step="0.01" value={newPeca.precoVenda} onChange={e => setNewPeca({...newPeca, precoVenda: e.target.value})} /></div>
                    <div className="col-span-2"><Label className="text-gray-700 dark:text-gray-300">Código de Barras (opcional)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={newPeca.codigoBarras} onChange={e => setNewPeca({...newPeca, codigoBarras: e.target.value})} /></div>
                    <div className="col-span-2">
                      <Label className="text-gray-700 dark:text-gray-300">Imagem</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {newPeca.imagem && (
                          <img 
                            src={newPeca.imagem.startsWith('/uploads') ? newPeca.imagem.replace('/uploads/produtos/', '/api/imagens/produtos/') : newPeca.imagem} 
                            alt="Preview" 
                            className="h-16 w-16 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-105 transition-transform" 
                            onClick={() => setZoomedImage(newPeca.imagem ?? null)} 
                          />
                        )}
                        <Button type="button" variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {newPeca.imagem ? "Alterar Imagem" : "Carregar Imagem"}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, setNewPeca)} accept="image/*" className="hidden" />
                      </div>
                    </div>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSavePeca}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {pecasCriticas.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
          <CardHeader className="pb-2"><CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Peças com stock baixo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pecasCriticas.map(p => (<Badge key={p.id} variant="destructive">{p.nome} ({p.qtdEstoque} {p.unidade})</Badge>))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader><CardTitle className="text-gray-900 dark:text-white">Peças em Stock</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-600 dark:text-gray-400">Imagem</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Código</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Nome</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Stock</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Custo</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Venda</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Margem</TableHead>
                {podeEditar && <TableHead className="text-gray-600 dark:text-gray-400">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pecas.map(p => (
                <TableRow key={p.id} className="border-gray-200 dark:border-gray-700">
                  <TableCell>
                    {p.imagem ? (
                      <img
                        src={p.imagem.startsWith('/uploads') ? p.imagem.replace('/uploads/produtos/', '/api/imagens/produtos/') : p.imagem}
                        alt={p.nome}
                        className="h-10 w-10 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setZoomedImage(p.imagem ?? null)}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{p.codigo}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{p.nome}</TableCell>
                  <TableCell className={p.qtdEstoque <= p.qtdMinima ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-900 dark:text-gray-200"}>
                    {p.qtdEstoque} {p.unidade}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{formatCurrency(p.custoPadrao || 0)}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{formatCurrency(p.precoVenda || 0)}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{p.margemLucro ? `${Number(p.margemLucro).toFixed(1)}%` : "-"}</TableCell>
                  {podeEditar && (
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleEditClick(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setSelectedPeca(p); setMovDialogOpen(true); }}>
                        Movimentar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {podeEditar && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent aria-describedby="edit-form-desc" className="max-w-3xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <p id="edit-form-desc" className="hidden">Formulário de edição de peça</p>
            <DialogHeader><DialogTitle className="text-gray-900 dark:text-white">Editar Peça - {selectedPeca?.nome}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-gray-700 dark:text-gray-300">Código</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={editForm.codigo} disabled /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Nome</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={editForm.nome} onChange={e => setEditForm({...editForm, nome: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Categoria</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={editForm.categoria} onChange={e => setEditForm({...editForm, categoria: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Unidade</Label>
                  <Select value={editForm.unidade} onValueChange={v => setEditForm({...editForm, unidade: v})}>
                    <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      {["UN","KG","L","M","PAR"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-gray-700 dark:text-gray-300">Quantidade Atual</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" value={editForm.qtdEstoque} onChange={e => setEditForm({...editForm, qtdEstoque: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Stock Mínimo</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" value={editForm.qtdMinima} onChange={e => setEditForm({...editForm, qtdMinima: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Preço de Custo (€)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" step="0.01" value={editForm.custoPadrao} onChange={e => setEditForm({...editForm, custoPadrao: e.target.value})} /></div>
                <div><Label className="text-gray-700 dark:text-gray-300">Preço de Venda (€)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" step="0.01" value={editForm.precoVenda} onChange={e => setEditForm({...editForm, precoVenda: e.target.value})} /></div>
                <div className="col-span-2"><Label className="text-gray-700 dark:text-gray-300">Código de Barras (opcional)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={editForm.codigoBarras} onChange={e => setEditForm({...editForm, codigoBarras: e.target.value})} /></div>
                <div className="col-span-2">
                  <Label className="text-gray-700 dark:text-gray-300">Imagem</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {editForm.imagem && (
                      <img 
                        src={editForm.imagem.startsWith('/uploads') ? editForm.imagem.replace('/uploads/produtos/', '/api/imagens/produtos/') : editForm.imagem} 
                        alt="Preview" 
                        className="h-16 w-16 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-105 transition-transform" 
                        onClick={() => setZoomedImage(editForm.imagem ?? null)} 
                      />
                    )}
                    <Button type="button" variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {editForm.imagem ? "Alterar Imagem" : "Carregar Imagem"}
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, setEditForm)} accept="image/*" className="hidden" />
                  </div>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdatePeca}>Atualizar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Movimentação */}
      {podeEditar && (
        <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
          <DialogContent aria-describedby="mov-form-desc" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <p id="mov-form-desc" className="hidden">Formulário de movimentação de stock</p>
            <DialogHeader><DialogTitle className="text-gray-900 dark:text-white">Movimentar Stock - {selectedPeca?.nome}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-gray-700 dark:text-gray-300">Tipo</Label>
                <Select value={movimentacao.tipo} onValueChange={(v: any) => setMovimentacao({...movimentacao, tipo: v})}>
                  <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="ENTRADA">Entrada</SelectItem>
                    <SelectItem value="SAIDA">Saída</SelectItem>
                    <SelectItem value="AJUSTE">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-gray-700 dark:text-gray-300">Quantidade</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" value={movimentacao.quantidade} onChange={e => setMovimentacao({...movimentacao, quantidade: e.target.value})} /></div>
              {movimentacao.tipo !== "AJUSTE" && (<div><Label className="text-gray-700 dark:text-gray-300">Custo Unitário (€)</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="number" step="0.01" value={movimentacao.custo} onChange={e => setMovimentacao({...movimentacao, custo: e.target.value})} /></div>)}
              <div><Label className="text-gray-700 dark:text-gray-300">Observações</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={movimentacao.observacoes} onChange={e => setMovimentacao({...movimentacao, observacoes: e.target.value})} /></div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleMovimentar}>Confirmar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Zoom */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage.startsWith('/uploads') ? zoomedImage.replace('/uploads/produtos/', '/api/imagens/produtos/') : zoomedImage} alt="Zoom" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
          <button className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700" onClick={() => setZoomedImage(null)}><X className="h-6 w-6" /></button>
        </div>
      )}
    </div>
  );
}
