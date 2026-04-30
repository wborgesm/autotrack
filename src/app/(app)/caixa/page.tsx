"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, ShoppingCart, Plus, Minus, CheckCircle, XCircle, CreditCard, Store, Wallet, Smartphone, Building, Receipt, Package, Wrench } from "lucide-react";

interface PagamentoTemporario {
  metodo: string;
  valor: number;
  referencia?: string;
}

const metodoIcone: Record<string, React.ReactNode> = {
  dinheiro: <Wallet className="h-4 w-4" />,
  cartao: <CreditCard className="h-4 w-4" />,
  mbway: <Smartphone className="h-4 w-4" />,
  transferencia: <Building className="h-4 w-4" />,
  referencia_mb: <Receipt className="h-4 w-4" />,
};

const metodoNome: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  mbway: "MB WAY",
  transferencia: "Transferência",
  referencia_mb: "Ref. Multibanco",
};

export default function CaixaPage() {
  const { data: session } = useSession();
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixaId, setCaixaId] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [pagamentos, setPagamentos] = useState<PagamentoTemporario[]>([]);
  const [metodoSelecionado, setMetodoSelecionado] = useState("dinheiro");
  const [valorPago, setValorPago] = useState("");
  const [referencia, setReferencia] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogLivre, setDialogLivre] = useState(false);
  const [itemLivreNome, setItemLivreNome] = useState("");
  const [itemLivreValor, setItemLivreValor] = useState("");

  const total = carrinho.reduce((acc, item) => acc + (item.precoVenda || item.preco || 0) * item.quantidade, 0);
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const troco = pagamentos.filter(p => p.metodo === "dinheiro").reduce((acc, p) => acc + p.valor, 0) - total;
  const faltaPagar = Math.max(0, total - totalPago);

  useEffect(() => {
    fetch("/api/caixa/status").then(r => r.json()).then(d => {
      setCaixaAberto(d.aberto);
      if (d.caixaId) setCaixaId(d.caixaId);
    });
    fetch("/api/estoque").then(r => r.json()).then(d => setProdutos(d.pecas || d));
  }, []);

  const abrirCaixa = async () => {
    const valor = parseFloat(saldoInicial);
    if (isNaN(valor) || valor < 0) return alert("Insira um saldo inicial válido.");
    const res = await fetch("/api/caixa/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saldoInicial: valor }),
    });
    const data = await res.json();
    if (data.id) {
      setCaixaAberto(true);
      setCaixaId(data.id);
    } else {
      alert(data.error || "Erro ao abrir caixa");
    }
  };

  const fecharCaixa = async () => {
    if (!confirm("Tem a certeza que deseja fechar o caixa?")) return;
    await fetch("/api/caixa/fechar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caixaId }),
    });
    setCaixaAberto(false);
    setCaixaId("");
    setSaldoInicial("");
    setCarrinho([]);
    setPagamentos([]);
    setClienteNome("");
  };

  const adicionarAoCarrinho = (produto: any) => {
    const existente = carrinho.find(item => item.id === produto.id);
    if (existente) {
      setCarrinho(prev => prev.map(item => item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item));
    } else {
      setCarrinho(prev => [...prev, { ...produto, quantidade: 1, livre: false }]);
    }
  };

  const adicionarItemLivre = () => {
    const nome = itemLivreNome.trim();
    const valor = parseFloat(itemLivreValor);
    if (!nome || !valor || valor <= 0) return alert("Preencha nome e valor válido.");
    setCarrinho(prev => [...prev, { id: `livre_${Date.now()}`, nome, precoVenda: valor, quantidade: 1, livre: true }]);
    setItemLivreNome("");
    setItemLivreValor("");
    setDialogLivre(false);
  };

  const alterarQuantidade = (id: string, delta: number) => {
    setCarrinho(prev => prev.map(item => item.id === id ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item).filter(item => item.quantidade > 0));
  };

  const adicionarPagamento = () => {
    const valor = parseFloat(valorPago);
    if (!valor || valor <= 0) return alert("Insira um valor válido.");
    if (valor > faltaPagar) return alert(`Valor excede o total em falta (€ ${faltaPagar.toFixed(2)}).`);
    setPagamentos(prev => [...prev, { metodo: metodoSelecionado, valor, referencia: referencia || undefined }]);
    setValorPago("");
    setReferencia("");
  };

  const removerPagamento = (index: number) => {
    setPagamentos(prev => prev.filter((_, i) => i !== index));
  };

  const finalizarVenda = async () => {
    if (totalPago < total) return alert("Pagamento insuficiente.");
    setLoading(true);
    try {
      await fetch("/api/caixa/vender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caixaId,
          itens: carrinho,
          pagamentos,
          cliente: clienteNome,
          troco: troco > 0 ? troco : 0,
        }),
      });
      setCarrinho([]);
      setClienteNome("");
      setPagamentos([]);
      alert("✅ Venda finalizada!");
    } catch {
      alert("Erro ao finalizar venda.");
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = busca.trim()
    ? produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo?.toLowerCase().includes(busca.toLowerCase()))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Store className="h-8 w-8 text-blue-600" /> Ponto de Venda
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerir vendas e pagamentos</p>
        </div>
        <div className="flex items-center gap-3">
          {caixaAberto && (
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 px-3 py-1">
              🟢 Caixa Aberto
            </Badge>
          )}
          {!caixaAberto && (
            <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 px-3 py-1">
              🔴 Caixa Fechado
            </Badge>
          )}
          {caixaAberto && (
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/caixa/fechar"} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <XCircle className="h-4 w-4 mr-1" /> Fechar Caixa
            </Button>
          )}
        </div>
      </div>

      {!caixaAberto ? (
        <Card className="glass max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full p-4 w-fit">
              <Store className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Abertura de Caixa</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Defina o dinheiro inicial em caixa para começar as vendas
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Dinheiro inicial (troco)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-gray-500">€</span>
                <Input
                  type="number"
                  value={saldoInicial}
                  onChange={e => setSaldoInicial(e.target.value)}
                  placeholder="0,00"
                  className="pl-8 text-lg h-12"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Ex: 50,00 para troco inicial</p>
            </div>
            <Button onClick={abrirCaixa} className="w-full h-12 text-base bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-5 w-5 mr-2" /> Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produtos + Busca */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" /> Produtos
                  </CardTitle>
                  <Dialog open={dialogLivre} onOpenChange={setDialogLivre}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Wrench className="h-4 w-4 mr-1" /> Item livre
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader><DialogTitle>Item Livre (Serviço/Mão‑de‑Obra)</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>Nome</Label>
                          <Input value={itemLivreNome} onChange={e => setItemLivreNome(e.target.value)} placeholder="Ex: Troca de óleo" />
                        </div>
                        <div>
                          <Label>Valor (€)</Label>
                          <Input type="number" value={itemLivreValor} onChange={e => setItemLivreValor(e.target.value)} placeholder="0,00" />
                        </div>
                        <Button onClick={adicionarItemLivre} className="w-full">Adicionar ao Carrinho</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar produto por nome ou código..."
                    className="pl-9"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {busca.trim() ? (
                  produtosFiltrados.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                      {produtosFiltrados.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => adicionarAoCarrinho(p)}
                          disabled={(p.qtdEstoque || 0) <= 0}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{p.nome}</span>
                          <span className="text-lg font-bold text-blue-600">€ {(p.precoVenda || p.preco || 0).toFixed(2)}</span>
                          <span className="text-xs text-gray-400">{p.qtdEstoque} un</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Nenhum produto encontrado para "{busca}".</p>
                  )
                ) : (
                  <p className="text-center text-gray-500 py-8">Digite para buscar produtos.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Carrinho + Pagamento */}
          <div className="space-y-4">
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Carrinho</span>
                  {carrinho.length > 0 && <Badge variant="secondary">{carrinho.length} itens</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {carrinho.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-sm">Selecione produtos ou adicione itens livres</p>
                  </div>
                )}
                {carrinho.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-medium truncate">{item.nome}</p>
                        {item.livre && <Wrench className="h-3 w-3 text-gray-400" />}
                      </div>
                      <p className="text-xs text-gray-500">€ {((item.precoVenda || item.preco || 0) * item.quantidade).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button size="sm" variant="ghost" onClick={() => alterarQuantidade(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center font-mono">{item.quantidade}</span>
                      <Button size="sm" variant="ghost" onClick={() => alterarQuantidade(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
                {carrinho.length > 0 && (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Subtotal</span>
                        <span>€ {total.toFixed(2)}</span>
                      </div>
                      {totalPago > total && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Troco</span>
                          <span>€ {troco.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg mt-1">
                        <span>Total</span>
                        <span>€ {total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Cliente (opcional)</Label>
                      <Input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Nome do cliente" className="h-8 text-sm" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {carrinho.length > 0 && (
              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-1">
                    <Select value={metodoSelecionado} onValueChange={setMetodoSelecionado}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                        <SelectItem value="cartao">💳 Cartão</SelectItem>
                        <SelectItem value="mbway">📱 MB WAY</SelectItem>
                        <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                        <SelectItem value="referencia_mb">🔢 Ref. MB</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={valorPago} onChange={e => setValorPago(e.target.value)} placeholder="Valor" className="w-24" />
                    {(metodoSelecionado === "mbway" || metodoSelecionado === "transferencia" || metodoSelecionado === "referencia_mb") && (
                      <Input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ref." className="w-24" />
                    )}
                    <Button size="icon" variant="outline" onClick={adicionarPagamento}><Plus className="h-4 w-4" /></Button>
                  </div>

                  {pagamentos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500">Pagamentos adicionados:</p>
                      {pagamentos.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            {metodoIcone[p.metodo]}
                            <span>{metodoNome[p.metodo]}: € {p.valor.toFixed(2)}</span>
                            {p.referencia && <span className="text-xs text-gray-400">({p.referencia})</span>}
                          </div>
                          <Button size="sm" variant="ghost" className="text-red-500 h-6 w-6 p-0" onClick={() => removerPagamento(i)}><XCircle className="h-3 w-3" /></Button>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                        <span>Total pago:</span>
                        <span className="font-bold">€ {totalPago.toFixed(2)}</span>
                      </div>
                      {faltaPagar > 0 && (
                        <p className="text-xs text-amber-600">Em falta: € {faltaPagar.toFixed(2)}</p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={finalizarVenda}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading || totalPago < total}
                  >
                    {loading ? "Finalizando..." : "Finalizar Venda"}
                    {!loading && <CheckCircle className="h-4 w-4 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
