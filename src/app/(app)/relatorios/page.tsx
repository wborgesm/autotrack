"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RelatoriosPage() {
  const { data: session } = useSession();
  const [tipo, setTipo] = useState("resumo");
  const [inicio, setInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [fim, setFim] = useState(new Date().toISOString().slice(0, 10));
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRelatorio = async () => { setLoading(true); const res = await fetch(`/api/relatorios?tipo=${tipo}&inicio=${inicio}&fim=${fim}`); const data = await res.json(); setDados(data); setLoading(false); };
  useEffect(() => { if (session) fetchRelatorio(); }, [session, tipo, inicio, fim]);

  const exportarCSV = () => { if (!dados) return; let csv = ""; const linhas: any[] = []; /* ... */ const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `relatorio-${tipo}.csv`; a.click(); };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
      <div className="flex flex-wrap gap-4 items-end">
        <div><Label className="text-gray-700 dark:text-gray-300">Tipo</Label><Select value={tipo} onValueChange={setTipo}><SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white w-40"><SelectValue /></SelectTrigger><SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"><SelectItem value="resumo">Resumo</SelectItem><SelectItem value="ordens">Ordens</SelectItem><SelectItem value="financeiro">Financeiro</SelectItem></SelectContent></Select></div>
        <div><Label className="text-gray-700 dark:text-gray-300">Início</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></div>
        <div><Label className="text-gray-700 dark:text-gray-300">Fim</Label><Input className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" type="date" value={fim} onChange={e => setFim(e.target.value)} /></div>
        <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" onClick={fetchRelatorio} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
        <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" onClick={exportarCSV}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
      </div>
      {dados && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader><CardTitle className="text-gray-900 dark:text-white">Resultados</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="border-gray-200 dark:border-gray-700"><TableHead className="text-gray-600 dark:text-gray-400">Métrica</TableHead><TableHead className="text-gray-600 dark:text-gray-400">Valor</TableHead></TableRow></TableHeader>
              <TableBody>{Object.entries(dados).map(([k, v]) => (<TableRow key={k} className="border-gray-200 dark:border-gray-700"><TableCell className="text-gray-900 dark:text-gray-200">{k}</TableCell><TableCell className="text-gray-900 dark:text-gray-200">{String(v)}</TableCell></TableRow>))}</TableBody></Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
