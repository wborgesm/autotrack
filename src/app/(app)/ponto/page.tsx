"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";
import { Play, Coffee, LogOut, Clock } from "lucide-react";

export default function PontoPage() {
  const { data: session } = useSession();
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [ordens, setOrdens] = useState<any[]>([]);
  const [tecnicoId, setTecnicoId] = useState("");
  const [ordemId, setOrdemId] = useState("");
  const [registos, setRegistos] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!session) return;
    fetch("/api/tecnicos").then(r => r.json()).then(setTecnicos).catch(() => setTecnicos([]));
    fetch("/api/ordens?status=ABERTA&status=EM_DIAGNOSTICO&status=EM_SERVICO")
      .then(r => r.json()).then(setOrdens).catch(() => setOrdens([]));
  }, [session]);

  const fetchRegistos = () => {
    if (!tecnicoId) return;
    fetch(`/api/tempo?tecnicoId=${tecnicoId}`).then(r => r.json()).then(setRegistos).catch(() => setRegistos([]));
  };
  useEffect(() => { fetchRegistos(); }, [tecnicoId]);

  const registar = async (tipo: string) => {
    if (!tecnicoId) { setMsg("Selecione o técnico."); return; }
    const res = await fetch("/api/tempo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tecnicoId, ordemId: ordemId || null, tipo }) });
    if (res.ok) { setMsg(`✅ ${tipo} registado!`); fetchRegistos(); }
    else { const err = await res.json(); setMsg("❌ " + (err.error || "Erro")); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Clock className="h-6 w-6 text-blue-600" /> Ponto Eletrónico</h1>
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader><CardTitle>Registar Ponto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Técnico</Label><Select onValueChange={setTecnicoId}><SelectTrigger className="bg-gray-100 dark:bg-gray-700"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent className="bg-white dark:bg-gray-800">{tecnicos.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>OS (opcional)</Label><Select onValueChange={setOrdemId}><SelectTrigger className="bg-gray-100 dark:bg-gray-700"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent className="bg-white dark:bg-gray-800"><SelectItem value="__none__">Nenhuma</SelectItem>{ordens.map((o: any) => <SelectItem key={o.id} value={o.id}>#{o.numero} - {o.cliente?.nome}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => registar("ENTRADA")} className="bg-green-600"><Play className="mr-2 h-4 w-4" /> Iniciar</Button>
            <Button onClick={() => registar("INTERVALO_INICIO")} className="bg-yellow-600"><Coffee className="mr-2 h-4 w-4" /> Intervalo</Button>
            <Button onClick={() => registar("INTERVALO_FIM")} className="bg-yellow-700"><Play className="mr-2 h-4 w-4" /> Fim Intervalo</Button>
            <Button onClick={() => registar("SAIDA")} className="bg-red-600"><LogOut className="mr-2 h-4 w-4" /> Terminar</Button>
          </div>
          {msg && <p className="text-sm font-medium text-gray-900 dark:text-white">{msg}</p>}
        </CardContent>
      </Card>
      {tecnicoId && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader><CardTitle>Registos de Hoje</CardTitle></CardHeader>
          <CardContent>
            {registos.length === 0 && <p className="text-gray-500">Nenhum registo hoje.</p>}
            {registos.map((r: any) => (
              <div key={r.id} className="flex justify-between text-sm text-gray-700 dark:text-gray-300"><span>{r.tipo.replace(/_/g, " ")}</span><span>{formatDateTime(r.dataHora)}</span></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
