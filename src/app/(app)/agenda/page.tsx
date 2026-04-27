"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { Plus, Calendar as CalendarIcon, Clock, Car, User, Wrench, Phone, FileText, Check, X, Play } from "lucide-react";

export default function AgendaPage() {
  const { data: session } = useSession();
  const [eventos, setEventos] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [form, setForm] = useState({ clienteId: "", veiculoId: "", servicoId: "", dataHora: "", observacoes: "" });
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchAgendamentos = () => {
    if (!session) return;
    setLoading(true);
    fetch("/api/agendamentos")
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setEventos(arr);
        setAgendamentos(arr.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime()));
      })
      .catch(() => { setEventos([]); setAgendamentos([]); })
      .finally(() => setLoading(false));
  };

  const fetchClientes = () => fetch("/api/clientes?limit=100").then(r => r.json()).then(d => setClientes(Array.isArray(d.data) ? d.data : [])).catch(() => setClientes([]));
  const fetchVeiculos = () => fetch("/api/veiculos").then(r => r.json()).then(d => setVeiculos(Array.isArray(d) ? d : [])).catch(() => setVeiculos([]));
  const fetchServicos = () => fetch("/api/servicos").then(r => r.json()).then(d => setServicos(Array.isArray(d) ? d : [])).catch(() => setServicos([]));

  useEffect(() => { fetchAgendamentos(); fetchClientes(); fetchVeiculos(); fetchServicos(); }, [session]);

  const handleCreate = async () => {
    if (!form.clienteId || !form.veiculoId || !form.dataHora) { alert("Preencha cliente, veículo e data/hora."); return; }
    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId: form.clienteId, veiculoId: form.veiculoId, servicoId: form.servicoId || null, dataHora: new Date(form.dataHora).toISOString(), observacoes: form.observacoes, status: "PENDENTE", duracao: 60 }),
    });
    if (res.ok) { setDialogOpen(false); setForm({ clienteId: "", veiculoId: "", servicoId: "", dataHora: "", observacoes: "" }); fetchAgendamentos(); }
    else { const err = await res.json(); alert(err.error || "Erro ao criar agendamento"); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAgendamentos();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDENTE": return "bg-yellow-100 text-yellow-800";
      case "CONFIRMADO": return "bg-blue-100 text-blue-800";
      case "CONCLUIDO": return "bg-green-100 text-green-800";
      case "CANCELADO": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Agenda</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerir marcações e serviços</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
          </DialogTrigger>
          <DialogContent aria-describedby="agendamento-form-desc" className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <p id="agendamento-form-desc" className="hidden">Formulário de agendamento</p>
            <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Cliente</Label>
                <Select onValueChange={v => setForm({...form, clienteId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Veículo</Label>
                <Select onValueChange={v => setForm({...form, veiculoId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{veiculos.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Serviço (opcional)</Label>
                <Select onValueChange={v => setForm({...form, servicoId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{servicos.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data e Hora</Label><Input type="datetime-local" value={form.dataHora} onChange={e => setForm({...form, dataHora: e.target.value})} /></div>
              <div><Label>Observações</Label><Input value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} /></div>
              <Button onClick={handleCreate} className="bg-green-600 w-full">Agendar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendário - Responsivo */}
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Calendário
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          <div className="fc-mobile-responsive">
            <FullCalendar
              key={isMobile ? "mobile" : "desktop"}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={isMobile ? "dayGridMonth" : "timeGridWeek"}
              headerToolbar={
                isMobile
                  ? { left: "prev,next", center: "title", right: "dayGridMonth,timeGridDay" }
                  : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
              }
              events={eventos}
              locales={[ptBrLocale]}
              locale="pt-br"
              height={isMobile ? "auto" : 650}
              contentHeight={isMobile ? "auto" : "auto"}
              slotMinTime="08:00:00"
              slotMaxTime="19:00:00"
              buttonText={{
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia",
              }}
              views={{
                timeGridWeek: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
                dayGridMonth: { titleFormat: { year: "numeric", month: "long" } },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agendamentos */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Agendamentos ({agendamentos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          {!loading && agendamentos.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2" />
              <p>Nenhum agendamento</p>
            </div>
          )}
          <div className="divide-y dark:divide-gray-700">
            {!loading && agendamentos.map((ag: any) => (
              <div key={ag.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1.5 sm:p-2 shrink-0 mt-0.5">
                        <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{ag.title}</p>
                        <div className="mt-0.5 space-y-0.5">
                          <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> {formatDateTime(ag.start)}</p>
                          {ag.extendedProps?.veiculo && <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1"><Car className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> {ag.extendedProps.veiculo}</p>}
                          {ag.extendedProps?.telefone && <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> {ag.extendedProps.telefone}</p>}
                          {ag.extendedProps?.servico && <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1"><Wrench className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> {ag.extendedProps.servico}</p>}
                          {ag.extendedProps?.tecnico && <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1"><User className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> {ag.extendedProps.tecnico}</p>}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusBadge(ag.extendedProps?.status || "PENDENTE")}`}>
                      {ag.extendedProps?.status || "PENDENTE"}
                    </span>
                  </div>
                  {/* Botões de ação */}
                  <div className="flex gap-1.5 justify-end">
                    {ag.extendedProps?.status === "PENDENTE" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" onClick={() => handleStatusChange(ag.id, "CONFIRMADO")}><Check className="h-3 w-3 mr-1" /> Confirmar</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={() => handleStatusChange(ag.id, "CONCLUIDO")}><Play className="h-3 w-3 mr-1" /> Concluir</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100" onClick={() => handleStatusChange(ag.id, "CANCELADO")}><X className="h-3 w-3 mr-1" /> Cancelar</Button>
                      </>
                    )}
                    {ag.extendedProps?.status === "CONFIRMADO" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={() => handleStatusChange(ag.id, "CONCLUIDO")}><Play className="h-3 w-3 mr-1" /> Concluir</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100" onClick={() => handleStatusChange(ag.id, "CANCELADO")}><X className="h-3 w-3 mr-1" /> Cancelar</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
