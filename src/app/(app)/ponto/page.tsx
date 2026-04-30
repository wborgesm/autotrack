"use client";
import ScannerPonto from "@/components/ponto/ScannerPonto";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";
import { Play, Coffee, LogOut, Clock, MapPin, Navigation } from "lucide-react";

export default function PontoPage() {
  const { data: session } = useSession();
  const [tecnicoId, setTecnicoId] = useState("");
  const [referenciaId, setReferenciaId] = useState("");
  const [referenciaTipo, setReferenciaTipo] = useState<"tecnico" | "usuario">("usuario");
  const [ordemId, setOrdemId] = useState("");
  const [ordens, setOrdens] = useState<any[]>([]);
  const [registos, setRegistos] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [localizacao, setLocalizacao] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState("");

  useEffect(() => {
    if (!session) return;
    fetch(`/api/tecnicos?usuarioId=${session.user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const tecnico = Array.isArray(d) && d.length > 0 ? d[0] : null;
        if (tecnico) {
          setTecnicoId(tecnico.id);
          setReferenciaId(tecnico.id);
          setReferenciaTipo("tecnico");
          setMsg(`🔧 ${tecnico.nome} — pronto para registar`);
        } else {
          setReferenciaId(session.user.id);
          setReferenciaTipo("usuario");
          setMsg(`👤 ${session.user.name} — pronto para registar`);
        }
      })
      .catch(() => setMsg("Erro ao carregar dados."));

    fetch("/api/ordens?status=ABERTA&status=EM_DIAGNOSTICO&status=EM_SERVICO")
      .then(r => r.ok ? r.json() : []).then(d => setOrdens(Array.isArray(d) ? d : [])).catch(() => setOrdens([]));
    obterLocalizacao();
  }, [session]);

  const obterLocalizacao = () => {
    if (!navigator.geolocation) { setGeoStatus("Geolocalização não suportada."); return; }
    navigator.geolocation.getCurrentPosition(p => {
      setLocalizacao({ lat: p.coords.latitude, lng: p.coords.longitude });
      setGeoStatus(`📍 ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`);
    }, () => setGeoStatus("Erro ao obter localização."));
  };

  const fetchRegistos = () => {
    const param = referenciaTipo === "tecnico" ? `tecnicoId=${referenciaId}` : `usuarioId=${referenciaId}`;
    fetch(`/api/tempo?${param}`).then(r => r.ok ? r.json() : []).then(d => setRegistos(Array.isArray(d) ? d : [])).catch(() => setRegistos([]));
  };
  useEffect(() => { if (referenciaId) fetchRegistos(); }, [referenciaId]);

  const verificarLocalizacao = async () => {
    if (!localizacao) { setMsg("❌ Localização não disponível."); return false; }
    const res = await fetch("/api/tempo/localizacao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: localizacao.lat, longitude: localizacao.lng }) });
    const data = await res.json();
    if (!data.autorizado) { setMsg(`❌ ${data.mensagem}`); return false; }
    return true;
  };

  const registar = async (tipo: string) => {
    if (!referenciaId) { setMsg("❌ Não foi possível identificar o utilizador."); return; }
    if (!(await verificarLocalizacao())) return;
    const body: any = { tipo, ordemId: ordemId || null };
    if (referenciaTipo === "tecnico") body.tecnicoId = referenciaId;
    else body.usuarioId = referenciaId;

    const res = await fetch("/api/tempo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setMsg(`✅ ${tipo} registado!`); fetchRegistos(); }
    else { const err = await res.json(); setMsg("❌ " + (err.error || "Erro")); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="h-6 w-6 text-blue-600" /> Ponto Eletrónico</h1>
      <Card><CardContent className="flex items-center justify-between p-4"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" /><span className="text-sm">{geoStatus}</span></div><Button variant="outline" size="sm" onClick={obterLocalizacao}><Navigation className="h-4 w-4 mr-2" /> Obter Localização</Button></CardContent></Card>
      
      <ScannerPonto usuarioId={referenciaId || ""} />

      <Card><CardHeader><CardTitle>Registar Ponto</CardTitle></CardHeader><CardContent className="space-y-4">
        <div>
          <Label>Ordem de Serviço (opcional)</Label>
          <Select onValueChange={setOrdemId}>
            <SelectTrigger className="bg-gray-100 dark:bg-gray-700"><SelectValue placeholder="Selecione a OS" /></SelectTrigger>
            <SelectContent><SelectItem value="__none__">Nenhuma</SelectItem>{ordens.map((o: any) => <SelectItem key={o.id} value={o.id}>#{o.numero} - {o.cliente?.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => registar("ENTRADA")} className="bg-green-600"><Play className="mr-2 h-4 w-4" /> Iniciar</Button>
          <Button onClick={() => registar("INTERVALO_INICIO")} className="bg-yellow-600"><Coffee className="mr-2 h-4 w-4" /> Intervalo</Button>
          <Button onClick={() => registar("INTERVALO_FIM")} className="bg-yellow-700"><Play className="mr-2 h-4 w-4" /> Fim Intervalo</Button>
          <Button onClick={() => registar("SAIDA")} className="bg-red-600"><LogOut className="mr-2 h-4 w-4" /> Terminar</Button>
        </div>
        {msg && <p className="text-sm font-medium">{msg}</p>}
      </CardContent></Card>
      {referenciaId && (
        <Card><CardHeader><CardTitle>Registos de Hoje</CardTitle></CardHeader><CardContent>
          {registos.length === 0 && <p className="text-gray-500">Nenhum registo hoje.</p>}
          {registos.map((r: any) => (<div key={r.id} className="flex justify-between text-sm py-1"><span>{r.tipo.replace(/_/g, " ")}</span><span>{formatDateTime(r.dataHora)}</span></div>))}
        </CardContent></Card>
      )}
    </div>
  );
}
