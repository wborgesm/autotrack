"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, DoorOpen, DoorClosed, Wallet, CreditCard, Package, Wrench, Smartphone, Plus } from "lucide-react";

interface CartItem {
  id: string;
  tipo: "produto" | "servico" | "livre";
  nome: string;
  preco: number;
  qtd: number;
}

export default function CaixaPage() {
  const { data: session } = useSession();
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState("");
  const [vendas, setVendas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [metodoPagamento, setMetodoPagamento] = useState("DINHEIRO");
  const [valorRecebido, setValorRecebido] = useState("");
  const [msg, setMsg] = useState("");
  const [itemLivre, setItemLivre] = useState({ nome: "", preco: "" });

  useEffect(() => {
    if (!session) return;
    fetch("/api/caixa/status").then(r => r.json()).then(d => {
      setCaixaAberto(d.aberto || false);
      if (d.aberto) { setSaldoInicial(d.saldoInicial || "0"); fetchVendas(); }
    }).catch(() => {});
    fetch("/api/estoque").then(r => r.json()).then(d => setProdutos(d.pecas || [])).catch(() => setProdutos([]));
    fetch("/api/servicos").then(r => r.json()).then(d => setServicos(Array.isArray(d) ? d : [])).catch(() => setServicos([]));
  }, [session]);

  const fetchVendas = () => { fetch("/api/caixa/vendas").then(r => r.json()).then(setVendas).catch(() => setVendas([])); };

  const abrirCaixa = async () => {
    const res = await fetch("/api/caixa/abrir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saldoInicial: parseFloat(saldoInicial) || 0 }) });
    if (res.ok) { setCaixaAberto(true); fetchVendas(); }
  };

  const fecharCaixa = async () => {
    const res = await fetch("/api/caixa/fechar", { method: "POST" });
    if (res.ok) { setCaixaAberto(false); setVendas([]); }
  };

  const adicionarAoCarrinho = useCallback((item: any, tipo: "produto" | "servico" | "livre") => {
    let preco = 0;
    if (tipo === "servico") preco = Number(item.precoMaoObra) || 0;
    else if (tipo === "produto") preco = Number(item.precoVenda) || 0;
    else if (tipo === "livre") preco = parseFloat(itemLivre.preco) || 0;

    const id = tipo === "livre" ? Date.now().toString() : item.id;
    const nome = tipo === "livre" ? itemLivre.nome : item.nome;

    setCarrinho(prev => {
      const existe = prev.find(c => c.id === id && c.tipo === tipo);
      if (existe) {
        return prev.map(c => c.id === id && c.tipo === tipo ? { ...c, qtd: c.qtd + 1 } : c);
      }
      return [...prev, { id, tipo, nome, preco, qtd: 1 }];
    });

    if (tipo === "livre") setItemLivre({ nome: "", preco: "" });
  }, [itemLivre]);

  const totalCarrinho = carrinho.reduce((sum, i) => sum + i.preco * i.qtd, 0);
  const troco = Math.max(parseFloat(valorRecebido || "0") - totalCarrinho, 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return;
    const res = await fetch("/api/caixa/vender", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens: carrinho, metodoPagamento, valorRecebido: parseFloat(valorRecebido) || 0 }),
    });
    if (res.ok) {
      setCarrinho([]);
      setValorRecebido("");
      setMsg("✅ Venda realizada!");
      fetchVendas();
    } else {
      const err = await res.json();
      setMsg("❌ " + (err.error || "Erro"));
    }
  };

  if (!session) return <div className="p-6 text-gray-900 dark:text-white">A carregar...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" /> Caixa</h1>
        {!caixaAberto ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-gray-700 dark:text-gray-300">Saldo Inicial (€)</Label>
              <Input type="number" step="0.01" value={saldoInicial} onChange={e => setSaldoInicial(e.target.value)} className="w-28 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" />
            </div>
            <Button onClick={abrirCaixa} className="bg-green-600 hover:bg-green-700 text-white"><DoorOpen className="mr-2 h-4 w-4" /> Abrir Caixa</Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Badge className="bg-green-600 text-white">Caixa Aberto</Badge>
            <Button onClick={fecharCaixa} className="bg-red-600 hover:bg-red-700 text-white"><DoorClosed className="mr-2 h-4 w-4" /> Fechar Caixa</Button>
          </div>
        )}
      </div>

      {caixaAberto && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="produtos">
              <TabsList className="bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="produtos"><Package className="h-4 w-4 mr-2" /> Produtos</TabsTrigger>
                <TabsTrigger value="servicos"><Wrench className="h-4 w-4 mr-2" /> Serviços</TabsTrigger>
                <TabsTrigger value="livre"><Plus className="h-4 w-4 mr-2" /> Livre</TabsTrigger>
              </TabsList>
              <TabsContent value="produtos">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader><CardTitle className="text-gray-900 dark:text-white">Produtos em Stock</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {produtos.map(p => (
                        <button key={p.id} onClick={() => adicionarAoCarrinho(p, "produto")} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left border border-gray-200 dark:border-gray-700">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{p.nome}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(p.precoVenda || 0)} | Stock: {p.qtdEstoque}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="servicos">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader><CardTitle className="text-gray-900 dark:text-white">Serviços</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {servicos.map(s => (
                        <button key={s.id} onClick={() => adicionarAoCarrinho(s, "servico")} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left border border-gray-200 dark:border-gray-700">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{s.nome}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(s.precoMaoObra || 0)}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="livre">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader><CardTitle className="text-gray-900 dark:text-white">Item Livre</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div><Label className="text-gray-700 dark:text-gray-300">Nome</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={itemLivre.nome} onChange={e => setItemLivre({...itemLivre, nome: e.target.value})} /></div>
                    <div><Label className="text-gray-700 dark:text-gray-300">Preço (€)</Label><Input type="number" step="0.01" className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" value={itemLivre.preco} onChange={e => setItemLivre({...itemLivre, preco: e.target.value})} /></div>
                    <Button onClick={() => { if (itemLivre.nome && itemLivre.preco) adicionarAoCarrinho({}, "livre"); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Adicionar</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader><CardTitle className="text-gray-900 dark:text-white">Últimas Vendas</CardTitle></CardHeader>
              <CardContent>
                {vendas.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma venda hoje.</p>}
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-600 dark:text-gray-400">Hora</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-400">Total</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-400">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map((v: any) => (
                      <TableRow key={v.id} className="border-gray-200 dark:border-gray-700">
                        <TableCell className="text-gray-900 dark:text-gray-200">{new Date(v.createdAt).toLocaleTimeString()}</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-200">{formatCurrency(v.total)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{v.metodoPagamento}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 sticky top-6">
              <CardHeader><CardTitle className="text-gray-900 dark:text-white flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Carrinho</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {carrinho.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Carrinho vazio.</p>}
                {carrinho.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>{item.nome} x{item.qtd}</span>
                    <span>{formatCurrency(item.preco * item.qtd)}</span>
                  </div>
                ))}
                {carrinho.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                      <span>Total</span><span>{formatCurrency(totalCarrinho)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-700 dark:text-gray-300 shrink-0">Método</Label>
                      <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                        <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <SelectItem value="DINHEIRO"><Wallet className="h-4 w-4 mr-2 inline" /> Dinheiro</SelectItem>
                          <SelectItem value="CARTAO"><CreditCard className="h-4 w-4 mr-2 inline" /> Cartão</SelectItem>
                          <SelectItem value="MBWAY"><Smartphone className="h-4 w-4 mr-2 inline" /> MBWay</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {metodoPagamento === "DINHEIRO" && (
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Valor Recebido (€)</Label>
                        <Input type="number" step="0.01" value={valorRecebido} onChange={e => setValorRecebido(e.target.value)} className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" />
                      </div>
                    )}
                    {valorRecebido && (
                      <div className="flex justify-between text-sm font-medium text-green-600 dark:text-green-400">
                        <span>Troco</span><span>{formatCurrency(troco)}</span>
                      </div>
                    )}
                    <Button onClick={finalizarVenda} className="w-full bg-green-600 hover:bg-green-700 text-white">Finalizar Venda</Button>
                  </>
                )}
                {msg && <p className={`text-sm font-medium ${msg.startsWith("✅") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{msg}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
