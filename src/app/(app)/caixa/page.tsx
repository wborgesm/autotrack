"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ShoppingCart, DollarSign, DoorOpen, DoorClosed, Wallet, Coffee, CreditCard, Package, Wrench, Smartphone } from "lucide-react";

export default function CaixaPage() {
  const { data: session } = useSession();
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState("");
  const [vendas, setVendas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [metodoPagamento, setMetodoPagamento] = useState("DINHEIRO");
  const [valorRecebido, setValorRecebido] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [msg, setMsg] = useState("");

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

  const adicionarAoCarrinho = (item: any, tipo: "produto" | "servico") => {
    const existente = carrinho.find(c => c.id === item.id && c.tipo === tipo);
    if (existente) {
      setCarrinho(carrinho.map(c => c.id === item.id && c.tipo === tipo ? { ...c, qtd: c.qtd + 1 } : c));
    } else {
      const preco = tipo === "servico" ? Number(item.precoMaoObra) : Number(item.precoVenda);
      setCarrinho([...carrinho, { id: item.id, tipo, nome: item.nome, preco, qtd: 1 }]);
    }
  };

  const totalCarrinho = carrinho.reduce((sum, i) => sum + i.preco * i.qtd, 0);
  const troco = parseFloat(valorRecebido || "0") - totalCarrinho;

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return;
    const res = await fetch("/api/caixa/vender", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens: carrinho, metodoPagamento, valorRecebido: parseFloat(valorRecebido) || 0 }),
    });
    if (res.ok) { setCarrinho([]); setValorRecebido(""); setMsg("✅ Venda realizada!"); fetchVendas(); }
    else { const err = await res.json(); setMsg("❌ " + (err.error || "Erro")); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Caixa</h1>
        {!caixaAberto ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-gray-700 dark:text-gray-300">Saldo Inicial (€)</Label>
              <Input type="number" step="0.01" value={saldoInicial} onChange={e => setSaldoInicial(e.target.value)} className="w-28 bg-gray-100 dark:bg-gray-700" />
            </div>
            <Button onClick={abrirCaixa} className="bg-green-600"><DoorOpen className="mr-2 h-4 w-4" /> Abrir Caixa</Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Badge className="bg-green-600 text-white">Caixa Aberto</Badge>
            <Button onClick={fecharCaixa} className="bg-red-600"><DoorClosed className="mr-2 h-4 w-4" /> Fechar Caixa</Button>
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
              </TabsList>
              <TabsContent value="produtos">
                <Card className="bg-white dark:bg-gray-800"><CardHeader><CardTitle>Produtos em Stock</CardTitle></CardHeader><CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {produtos.map(p => (
                      <button key={p.id} onClick={() => adicionarAoCarrinho(p, "produto")} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{p.nome}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(p.precoVenda || 0)} | Stock: {p.qtdEstoque}</p>
                      </button>
                    ))}
                  </div>
                </CardContent></Card>
              </TabsContent>
              <TabsContent value="servicos">
                <Card className="bg-white dark:bg-gray-800"><CardHeader><CardTitle>Serviços</CardTitle></CardHeader><CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {servicos.map(s => (
                      <button key={s.id} onClick={() => adicionarAoCarrinho(s, "servico")} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{s.nome}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(s.precoMaoObra || 0)}</p>
                      </button>
                    ))}
                  </div>
                </CardContent></Card>
              </TabsContent>
            </Tabs>
            <Card className="bg-white dark:bg-gray-800"><CardHeader><CardTitle>Últimas Vendas</CardTitle></CardHeader><CardContent>
              {vendas.length === 0 && <p className="text-gray-500 text-sm">Nenhuma venda hoje.</p>}
              <Table><TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Total</TableHead><TableHead>Método</TableHead></TableRow></TableHeader>
                <TableBody>{vendas.map((v: any) => (<TableRow key={v.id}><TableCell>{new Date(v.createdAt).toLocaleTimeString()}</TableCell><TableCell>{formatCurrency(v.total)}</TableCell><TableCell><Badge variant="outline">{v.metodoPagamento}</Badge></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent></Card>
          </div>

          <div>
            <Card className="bg-white dark:bg-gray-800 sticky top-6">
              <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Carrinho</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {carrinho.length === 0 && <p className="text-gray-500 text-sm">Carrinho vazio.</p>}
                {carrinho.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.nome} x{item.qtd}</span>
                    <span>{formatCurrency(item.preco * item.qtd)}</span>
                  </div>
                ))}
                {carrinho.length > 0 && (
                  <>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(totalCarrinho)}</span></div>
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-700 dark:text-gray-300 shrink-0">Método</Label>
                      <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                        <SelectTrigger className="bg-gray-100 dark:bg-gray-700"><SelectValue /></SelectTrigger>
                        <SelectContent>
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
                        <Input type="number" step="0.01" value={valorRecebido} onChange={e => setValorRecebido(e.target.value)} className="bg-gray-100 dark:bg-gray-700" />
                      </div>
                    )}
                    {troco >= 0 && valorRecebido && <div className="flex justify-between text-sm font-medium text-green-600"><span>Troco</span><span>{formatCurrency(troco)}</span></div>}
                    <Button onClick={finalizarVenda} className="w-full bg-green-600">Finalizar Venda</Button>
                  </>
                )}
                {msg && <p className="text-sm font-medium">{msg}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
