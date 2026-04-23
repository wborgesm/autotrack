"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, Trophy, Gift, Settings, RefreshCw, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RankingItem {
  id: string;
  pontos: number;
  nivel: string;
  cliente: { nome: string; telefone: string | null };
  transacoes: any[];
}

interface Stats {
  totalPontos: number;
  totalClientes: number;
  totalResgates: number;
}

export default function PontosPage() {
  const { data: session } = useSession();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPontos: 0, totalClientes: 0, totalResgates: 0 });
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [resgatarOpen, setResgatarOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<RankingItem | null>(null);
  const [quantidadeResgate, setQuantidadeResgate] = useState(0);

  const [config, setConfig] = useState({
    pontosPorReal: 10,
    bonusMoto: 15,
    minimoResgate: 500,
    validadeMeses: 12,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankingRes, statsRes] = await Promise.all([
        fetch("/api/addons/pontos?action=ranking"),
        fetch("/api/addons/pontos?action=stats"),
      ]);
      setRanking(await rankingRes.json());
      setStats(await statsRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user.addons?.pontos) {
      loadData();
    }
  }, [session]);

  const handleSaveConfig = async () => {
    const res = await fetch("/api/addons/pontos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "config",
        ...config,
      }),
    });
    if (res.ok) {
      setConfigOpen(false);
      loadData();
    }
  };

  const handleResgatar = async () => {
    if (!selectedCliente || quantidadeResgate <= 0) return;

    const res = await fetch("/api/addons/pontos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resgatar",
        clienteId: selectedCliente.id,
        quantidade: quantidadeResgate,
        descricao: "Resgate de pontos",
      }),
    });

    if (res.ok) {
      setResgatarOpen(false);
      setQuantidadeResgate(0);
      loadData();
    } else {
      const error = await res.json();
      alert(error.error);
    }
  };

  const getNivelColor = (nivel: string) => {
    const map: Record<string, string> = {
      BRONZE: "bg-amber-100 text-amber-800",
      PRATA: "bg-gray-200 text-gray-800",
      OURO: "bg-yellow-100 text-yellow-800",
      PLATINA: "bg-purple-100 text-purple-800",
    };
    return map[nivel] || "bg-gray-100";
  };

  if (!session?.user.addons?.pontos) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Addon Pontos de Fidelidade não ativo</h2>
        <p className="text-gray-500">Contate o administrador para ativar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programa de Fidelidade</h1>
          <p className="text-gray-500">Gerencie pontos e recompensas dos clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="dialog-desc"><p id="dialog-desc" class="hidden">Formulário</p>
              <DialogHeader>
                <DialogTitle>Configuração do Programa de Pontos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Pontos por € gasto</Label>
                  <Input
                    type="number"
                    value={config.pontosPorReal}
                    onChange={(e) => setConfig({ ...config, pontosPorReal: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bónus para motos (%)</Label>
                  <Input
                    type="number"
                    value={config.bonusMoto}
                    onChange={(e) => setConfig({ ...config, bonusMoto: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mínimo para resgate (pontos)</Label>
                  <Input
                    type="number"
                    value={config.minimoResgate}
                    onChange={(e) => setConfig({ ...config, minimoResgate: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validade dos pontos (meses)</Label>
                  <Input
                    type="number"
                    value={config.validadeMeses}
                    onChange={(e) => setConfig({ ...config, validadeMeses: parseInt(e.target.value) })}
                  />
                </div>
                <Button onClick={handleSaveConfig}>Guardar configuração</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de pontos</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPontos.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes participantes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resgates realizados</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResgates}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p>{item.cliente.nome}</p>
                      <p className="text-xs text-gray-500">{item.cliente.telefone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getNivelColor(item.nivel)}>{item.nivel}</Badge>
                  </TableCell>
                  <TableCell>{item.pontos.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCliente(item);
                        setResgatarOpen(true);
                      }}
                    >
                      <Gift className="mr-1 h-3 w-3" />
                      Resgatar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={resgatarOpen} onOpenChange={setResgatarOpen}>
        <DialogContent aria-describedby="dialog-desc"><p id="dialog-desc" class="hidden">Formulário</p>
          <DialogHeader>
            <DialogTitle>Resgatar pontos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCliente && (
              <>
                <p>
                  Cliente: <strong>{selectedCliente.cliente.nome}</strong>
                </p>
                <p>Saldo atual: {selectedCliente.pontos.toLocaleString()} pontos</p>
                <div className="space-y-2">
                  <Label>Quantidade a resgatar</Label>
                  <Input
                    type="number"
                    min={1}
                    max={selectedCliente.pontos}
                    value={quantidadeResgate}
                    onChange={(e) => setQuantidadeResgate(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    Mínimo: {config.minimoResgate} pontos
                  </p>
                </div>
                <Button onClick={handleResgatar} disabled={quantidadeResgate < config.minimoResgate}>
                  Confirmar resgate
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
