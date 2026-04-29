"use client";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AvatarIniciais } from "@/components/ui/AvatarIniciais";
import { useDebounce } from "@/hooks/useDebounce";
import { LayoutGrid, LayoutList, Download } from "lucide-react";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [vista, setVista] = useState<"cards" | "tabela">("tabela");
  const [pesquisa, setPesquisa] = useState("");
  const debouncedPesquisa = useDebounce(pesquisa, 300);

  useEffect(() => {
    fetch("/api/clientes")
      .then(r => r.json())
      .then(d => {
        // Aceitar array direto ou objeto com .clientes
        const lista = Array.isArray(d) ? d : Array.isArray(d.clientes) ? d.clientes : [];
        setClientes(lista);
      })
      .catch(() => setClientes([]));
    const saved = localStorage.getItem("clientes_vista");
    if (saved === "cards") setVista("cards");
  }, []);

  const toggleVista = () => {
    const nova = vista === "tabela" ? "cards" : "tabela";
    setVista(nova);
    localStorage.setItem("clientes_vista", nova);
  };

  const filtrados = useMemo(() => {
    if (!debouncedPesquisa) return clientes;
    const q = debouncedPesquisa.toLowerCase();
    return clientes.filter((c: any) =>
      c.nome?.toLowerCase().includes(q) ||
      c.cpf?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telefone?.includes(q)
    );
  }, [clientes, debouncedPesquisa]);

  const exportarCSV = () => {
    const cabecalho = "Nome,NIF,Telefone,Email,Morada,Data Registo";
    const linhas = clientes.map((c: any) =>
      `"${c.nome || ""}","${c.cpf || ""}","${c.telefone || ""}","${c.email || ""}","${c.endereco || ""}","${new Date(c.createdAt).toLocaleDateString("pt-PT")}"`
    );
    const blob = new Blob([cabecalho + "\n" + linhas.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clientes.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleVista}>
            {vista === "tabela" ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
        </div>
      </div>
      <Input placeholder="Pesquisar clientes..." value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
      {vista === "tabela" ? (
        <Card className="glass">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Veículos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.cpf || "-"}</TableCell>
                  <TableCell>{c.telefone || "-"}</TableCell>
                  <TableCell>{c.email || "-"}</TableCell>
                  <TableCell>{c._count?.ordens || 0}</TableCell>
                  <TableCell>{c._count?.veiculos || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((c: any) => (
            <Card key={c.id} className="glass p-4 flex items-center gap-4">
              <AvatarIniciais nome={c.nome} tamanho="lg" />
              <div>
                <p className="font-semibold">{c.nome}</p>
                <p className="text-sm text-gray-500">{c.cpf || "Sem NIF"}</p>
                <p className="text-sm text-gray-500">{c.telefone || "Sem telefone"}</p>
                <p className="text-xs mt-1">{c._count?.ordens || 0} OS · {c._count?.veiculos || 0} veículos</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
