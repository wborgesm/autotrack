"use client";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/index";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/index";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPlaca } from "@/lib/utils";
import { LayoutGrid, LayoutList, Download, Plus, Car, Bike, Truck } from "lucide-react";

const tipoIcone: Record<string, React.ElementType> = {
  CARRO: Car,
  MOTO: Bike,
  UTILITARIO: Car,
  CAMINHAO: Truck,
};

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [vista, setVista] = useState<"cards" | "tabela">("tabela");
  const [pesquisa, setPesquisa] = useState("");
  const debouncedPesquisa = useDebounce(pesquisa, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pesquisaCliente, setPesquisaCliente] = useState("");
  const [form, setForm] = useState({
    clienteId: "",
    tipo: "CARRO",
    placa: "",
    matricula: "",
    marca: "",
    modelo: "",
    ano: "",
    cor: "",
    combustivel: "",
    km: "",
    chassi: "",
    observacoes: "",
    imeiGps: "",
  });

  // Fetch inicial de veículos e clientes
  useEffect(() => {
    fetch("/api/veiculos")
      .then((r) => r.json())
      .then((d) => setVeiculos(Array.isArray(d) ? d : []))
      .catch(() => setVeiculos([]));

    fetch("/api/clientes?limit=100")
      .then((r) => r.json())
      .then((d) => setClientes(d.clientes || d.data || []))
      .catch(() => setClientes([]));

    const saved = localStorage.getItem("veiculos_vista");
    if (saved === "cards") setVista("cards");
  }, []);

  const toggleVista = () => {
    const nova = vista === "tabela" ? "cards" : "tabela";
    setVista(nova);
    localStorage.setItem("veiculos_vista", nova);
  };

  const filtrados = useMemo(() => {
    if (!debouncedPesquisa) return veiculos;
    const q = debouncedPesquisa.toLowerCase();
    return veiculos.filter(
      (v: any) =>
        v.placa?.toLowerCase().includes(q) ||
        v.marca?.toLowerCase().includes(q) ||
        v.modelo?.toLowerCase().includes(q)
    );
  }, [veiculos, debouncedPesquisa]);

  const clientesFiltrados = useMemo(() => {
    if (!pesquisaCliente) return clientes;
    const q = pesquisaCliente.toLowerCase();
    return clientes.filter((c: any) => c.nome.toLowerCase().includes(q));
  }, [clientes, pesquisaCliente]);

  const exportarCSV = () => {
    const cabecalho = "Tipo,Placa,Marca,Modelo,Ano,Cor,KM,Cliente,OS Ativas";
    const linhas = veiculos.map((v: any) =>
      `"${v.tipo}","${v.placa || ""}","${v.marca || ""}","${v.modelo || ""}","${v.ano || ""}","${v.cor || ""}","${v.km || ""}","${v.cliente?.nome || ""}","${v.ordens?.length || 0}"`
    );
    const blob = new Blob([cabecalho + "\n" + linhas.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "veiculos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    const body = {
      ...form,
      ano: form.ano ? parseInt(form.ano) : undefined,
      km: form.km ? parseInt(form.km) : undefined,
    };
    await fetch("/api/veiculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setDialogOpen(false);
    setForm({
      clienteId: "",
      tipo: "CARRO",
      placa: "",
      matricula: "",
      marca: "",
      modelo: "",
      ano: "",
      cor: "",
      combustivel: "",
      km: "",
      chassi: "",
      observacoes: "",
      imeiGps: "",
    });
    fetch("/api/veiculos")
      .then((r) => r.json())
      .then((d) => setVeiculos(Array.isArray(d) ? d : []));
    setPesquisaCliente("");
  };

  const IconeTipo = (tipo: string) => {
    const Icon = tipoIcone[tipo] || Car;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com ações */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleVista}>
            {vista === "tabela" ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setPesquisaCliente(""); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="form-desc">
              <p id="form-desc" className="hidden">
                Formulário de criação de veículo
              </p>
              <DialogHeader>
                <DialogTitle>Novo Veículo</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Cliente *</Label>
                  <SearchInput
                    placeholder="Pesquisar cliente..."
                    value={pesquisaCliente}
                    onChange={(v) => setPesquisaCliente(v)}
                  />
                  <Select
                    onValueChange={(v) => setForm({ ...form, clienteId: v })}
                    value={form.clienteId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientesFiltrados.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select
                    defaultValue="CARRO"
                    onValueChange={(v) => setForm({ ...form, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARRO">Carro</SelectItem>
                      <SelectItem value="MOTO">Moto</SelectItem>
                      <SelectItem value="UTILITARIO">Utilitário</SelectItem>
                      <SelectItem value="CAMINHAO">Caminhão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Placa *</Label>
                  <Input
                    value={form.placa}
                    onChange={(e) =>
                      setForm({ ...form, placa: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div>
                  <Label>Matrícula</Label>
                  <Input
                    value={form.matricula}
                    onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Marca *</Label>
                  <Input
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Modelo *</Label>
                  <Input
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ano</Label>
                  <Input
                    value={form.ano}
                    onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input
                    value={form.cor}
                    onChange={(e) => setForm({ ...form, cor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Combustível</Label>
                  <Select
                    onValueChange={(v) => setForm({ ...form, combustivel: v })}
                    value={form.combustivel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GASOLINA">Gasolina</SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="ELETRICO">Elétrico</SelectItem>
                      <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                      <SelectItem value="GAS">Gás</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>KM Atual</Label>
                  <Input
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Chassi</Label>
                  <Input
                    value={form.chassi}
                    onChange={(e) => setForm({ ...form, chassi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>IMEI GPS</Label>
                  <Input
                    value={form.imeiGps}
                    onChange={(e) => setForm({ ...form, imeiGps: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Observações</Label>
                  <Input
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="mt-4">
                Guardar
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pesquisa */}
      <Input
        placeholder="Pesquisar por placa, marca ou modelo..."
        value={pesquisa}
        onChange={(e) => setPesquisa(e.target.value)}
      />

      {/* Conteúdo condicional (tabela ou cards) */}
      {vista === "tabela" ? (
        <Card className="glass overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>OS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Badge variant="blue">
                      {IconeTipo(v.tipo)}
                      {v.tipo === "CARRO" ? "Carro" : v.tipo === "MOTO" ? "Moto" : v.tipo === "UTILITARIO" ? "Utilitário" : "Caminhão"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatPlaca(v.placa)}</TableCell>
                  <TableCell>
                    {v.marca} {v.modelo}
                  </TableCell>
                  <TableCell>{v.cliente?.nome || "-"}</TableCell>
                  <TableCell>{v.ano || "-"}</TableCell>
                  <TableCell>{v.cor || "-"}</TableCell>
                  <TableCell>{v.km != null ? v.km.toLocaleString() : "-"}</TableCell>
                  <TableCell>{v.ordens?.length ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((v: any) => {
            const Icon = tipoIcone[v.tipo] || Car;
            return (
              <Card key={v.id} className="glass p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {v.marca} {v.modelo}
                  </p>
                  <p className="text-sm font-mono">{formatPlaca(v.placa)}</p>
                  <p className="text-sm text-gray-500">
                    {v.cliente?.nome || "Sem cliente"}
                  </p>
                  <div className="flex flex-wrap gap-x-2 mt-1 text-xs text-gray-500">
                    {v.ano && <span>{v.ano}</span>}
                    {v.km != null && <span>· {v.km.toLocaleString()} km</span>}
                    {v.cor && <span>· {v.cor}</span>}
                  </div>
                  <p className="text-xs mt-1">
                    {v.ordens?.length ?? 0} OS ativas
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
