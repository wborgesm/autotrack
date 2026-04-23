"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Plus, Trash2, History } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

export default function OrdemDetalhePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [ordem, setOrdem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [laudo, setLaudo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [servicos, setServicos] = useState<any[]>([]);
  const [pecas, setPecas] = useState<any[]>([]);
  const [dialogServico, setDialogServico] = useState(false);
  const [dialogPeca, setDialogPeca] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [quantidadeServico, setQuantidadeServico] = useState(1);
  const [pecaSelecionada, setPecaSelecionada] = useState("");
  const [quantidadePeca, setQuantidadePeca] = useState(1);

  const fetchOrdem = async () => {
    const res = await fetch(`/api/ordens/${id}`);
    const data = await res.json();
    setOrdem(data);
    setStatus(data.status);
    setLaudo(data.laudoTecnico || "");
    setObservacoes(data.observacoes || "");
    setLoading(false);
  };

  const fetchServicos = async () => {
    const res = await fetch("/api/servicos");
    setServicos(await res.json());
  };

  const fetchPecas = async () => {
    const res = await fetch("/api/estoque");
    const data = await res.json();
    setPecas(data.pecas || []);
  };

  useEffect(() => {
    if (session) {
      fetchOrdem();
      fetchServicos();
      fetchPecas();
    }
  }, [session, id]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      status,
      laudoTecnico: laudo,
      observacoes,
    };
    const res = await fetch(`/api/ordens/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Ordem atualizada!");
      fetchOrdem();
    } else {
      const err = await res.json();
      alert("Erro: " + (err.error || "Erro ao guardar"));
    }
    setSaving(false);
  };

  const handleAddServico = async () => {
    if (!servicoSelecionado) return;
    const servico = servicos.find(s => s.id === servicoSelecionado);
    if (!servico) return;
    const res = await fetch(`/api/ordens/${id}/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "servico",
        servicoId: servicoSelecionado,
        quantidade: quantidadeServico,
        valorUnit: servico.precoMaoObra,
      }),
    });
    if (res.ok) {
      setDialogServico(false);
      fetchOrdem();
    } else {
      alert("Erro ao adicionar serviço");
    }
  };

  const handleAddPeca = async () => {
    if (!pecaSelecionada) return;
    const peca = pecas.find(p => p.id === pecaSelecionada);
    if (!peca) return;
    const res = await fetch(`/api/ordens/${id}/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "peca",
        pecaId: pecaSelecionada,
        quantidade: quantidadePeca,
        valorUnit: peca.custoPadrao || 0,
      }),
    });
    if (res.ok) {
      setDialogPeca(false);
      fetchOrdem();
    } else {
      alert("Erro ao adicionar peça");
    }
  };

  const handleRemoverItem = async (itemId: string, tipo: "servico" | "peca") => {
    if (!confirm("Remover este item?")) return;
    await fetch(`/api/ordens/${id}/itens/${itemId}?tipo=${tipo}`, { method: "DELETE" });
    fetchOrdem();
  };

  if (loading) return <div className="p-6">A carregar...</div>;
  if (!ordem) return <div className="p-6">Ordem não encontrada.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/ordens")}><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Button>
        <h1 className="text-2xl font-bold">OS #{ordem.numero}</h1>
        <Badge className={getStatusColor(ordem.status)}>{getStatusLabel(ordem.status)}</Badge>
      </div>

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="pecas">Peças</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div><Label>Cliente</Label><Input value={ordem.cliente?.nome} disabled /></div>
              <div><Label>Veículo</Label><Input value={`${ordem.veiculo?.placa} - ${ordem.veiculo?.modelo}`} disabled /></div>
              <div><Label>KM Entrada</Label><Input value={ordem.kmEntrada || ""} disabled /></div>
              <div><Label>Data Entrada</Label><Input value={formatDate(ordem.dataEntrada)} disabled /></div>
              <div className="col-span-2"><Label>Relato do Cliente</Label><Textarea value={ordem.relatoCliente || ""} disabled rows={2} /></div>
              <div className="col-span-2"><Label>Laudo Técnico</Label><Textarea value={laudo} onChange={e => setLaudo(e.target.value)} rows={3} /></div>
              <div className="col-span-2"><Label>Observações</Label><Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Alterar Status</CardTitle></CardHeader>
            <CardContent>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABERTA">Aberta</SelectItem>
                  <SelectItem value="EM_DIAGNOSTICO">Em diagnóstico</SelectItem>
                  <SelectItem value="AGUARDANDO_PECAS">A aguardar peças</SelectItem>
                  <SelectItem value="EM_SERVICO">Em serviço</SelectItem>
                  <SelectItem value="TESTE_FINAL">Teste final</SelectItem>
                  <SelectItem value="PRONTA">Pronta</SelectItem>
                  <SelectItem value="ENTREGUE">Entregue</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}><Save className="mr-2 h-4 w-4"/>Guardar Alterações</Button>
          </div>
        </TabsContent>

        <TabsContent value="servicos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Serviços Realizados</CardTitle>
              <Dialog open={dialogServico} onOpenChange={setDialogServico}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4"/>Adicionar Serviço</Button></DialogTrigger>
                <DialogContent aria-describedby="dialog-desc"><p id="dialog-desc" class="hidden">Formulário</p>
                  <DialogHeader><DialogTitle>Adicionar Serviço</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Select onValueChange={setServicoSelecionado}>
                      <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                      <SelectContent>{servicos.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - {formatCurrency(s.precoMaoObra)}</SelectItem>)}</SelectContent>
                    </Select>
                    <div><Label>Quantidade</Label><Input type="number" min={1} value={quantidadeServico} onChange={e => setQuantidadeServico(parseInt(e.target.value))}/></div>
                    <Button onClick={handleAddServico}>Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Qtd</TableHead><TableHead>Unitário</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>{ordem.itens?.map((item: any) => (<TableRow key={item.id}><TableCell>{item.servico?.nome}</TableCell><TableCell>{item.quantidade}</TableCell><TableCell>{formatCurrency(item.valorUnit)}</TableCell><TableCell>{formatCurrency(item.total)}</TableCell><TableCell><Button size="sm" variant="destructive" onClick={() => handleRemoverItem(item.id, "servico")}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pecas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Peças Utilizadas</CardTitle>
              <Dialog open={dialogPeca} onOpenChange={setDialogPeca}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4"/>Adicionar Peça</Button></DialogTrigger>
                <DialogContent aria-describedby="dialog-desc"><p id="dialog-desc" class="hidden">Formulário</p>
                  <DialogHeader><DialogTitle>Adicionar Peça</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Select onValueChange={setPecaSelecionada}>
                      <SelectTrigger><SelectValue placeholder="Selecione a peça" /></SelectTrigger>
                      <SelectContent>{pecas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} - Stock: {p.qtdEstoque}</SelectItem>)}</SelectContent>
                    </Select>
                    <div><Label>Quantidade</Label><Input type="number" min={1} value={quantidadePeca} onChange={e => setQuantidadePeca(parseFloat(e.target.value))}/></div>
                    <Button onClick={handleAddPeca}>Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Peça</TableHead><TableHead>Qtd</TableHead><TableHead>Unitário</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>{ordem.itensPeca?.map((item: any) => (<TableRow key={item.id}><TableCell>{item.peca?.nome}</TableCell><TableCell>{item.quantidade}</TableCell><TableCell>{formatCurrency(item.valorUnit)}</TableCell><TableCell>{formatCurrency(item.total)}</TableCell><TableCell><Button size="sm" variant="destructive" onClick={() => handleRemoverItem(item.id, "peca")}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader><CardTitle>Histórico de Alterações</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ordem.historico?.map((h: any) => (<div key={h.id} className="border-b pb-2"><p className="font-medium">{getStatusLabel(h.status)}</p><p className="text-sm text-gray-500">{h.usuarioNome} - {formatDate(h.createdAt)}</p><p className="text-sm">{h.observacao}</p></div>))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Resumo Financeiro</CardTitle></CardHeader>
        <CardContent className="flex justify-between items-center">
          <div><span className="text-gray-600">Mão de Obra:</span> <strong>{formatCurrency(ordem.totalMaoObra)}</strong></div>
          <div><span className="text-gray-600">Peças:</span> <strong>{formatCurrency(ordem.totalPecas)}</strong></div>
          <div><span className="text-gray-600">Desconto:</span> <strong>{formatCurrency(ordem.desconto)}</strong></div>
          <div><span className="text-gray-600">Total:</span> <strong className="text-lg">{formatCurrency(ordem.total)}</strong></div>
        </CardContent>
      </Card>
    </div>
  );
}
