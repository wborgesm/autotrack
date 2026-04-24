"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useSession } from "next-auth/react";
import { Plus, X, Check, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Agendamento {
  id: string;
  dataHora: string;
  duracao: number;
  status: string;
  observacoes?: string;
  cliente: { nome: string; telefone?: string };
  veiculo: { placa: string; modelo: string };
  servico?: { nome: string };
  tecnico?: { nome: string };
}

export default function AgendaPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Agendamento | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAgendamento, setNewAgendamento] = useState({
    clienteId: "",
    veiculoId: "",
    servicoId: "",
    tecnicoId: "",
    dataHora: "",
    duracao: 60,
    observacoes: "",
  });
  const [clientes, setClientes] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);

  const fetchAgendamentos = useCallback(async () => {
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - 1);
    const fim = new Date();
    fim.setMonth(fim.getMonth() + 3);
    const res = await fetch(
      `/api/agendamentos?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`
    );
    const data = await res.json();
    const mapped = data.map((a: any) => ({
      id: a.id,
      title: `${a.cliente.nome} - ${a.veiculo.modelo} (${a.veiculo.placa})`,
      start: new Date(a.dataHora),
      end: new Date(new Date(a.dataHora).getTime() + a.duracao * 60000),
      resource: a,
    }));
    setEvents(mapped);
  }, []);

  const fetchOptions = useCallback(async () => {
    const [clientesRes, veiculosRes, servicosRes, tecnicosRes] = await Promise.all([
      fetch("/api/clientes?limit=100"),
      fetch("/api/veiculos"),
      fetch("/api/servicos"),
      fetch("/api/tecnicos"),
    ]);
    setClientes((await clientesRes.json()).data);
    setVeiculos(await veiculosRes.json());
    setServicos(await servicosRes.json());
    setTecnicos(await tecnicosRes.json());
  }, []);

  useEffect(() => {
    if (session) {
      fetchAgendamentos();
      fetchOptions();
      setLoading(false);
    }
  }, [session, fetchAgendamentos, fetchOptions]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setNewAgendamento({
      ...newAgendamento,
      dataHora: slotInfo.start.toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelected(event.resource);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!newAgendamento.clienteId || !newAgendamento.veiculoId || !newAgendamento.dataHora) {
      alert("Preencha cliente, veículo e data/hora.");
      return;
    }
    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAgendamento),
    });
    if (res.ok) {
      setDialogOpen(false);
      fetchAgendamentos();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    await fetch(`/api/agendamentos/${id}`, { method: "DELETE" });
    fetchAgendamentos();
  };

  const statusBadge = (status: string) => {
    const map: any = {
      PENDENTE: "bg-yellow-100 text-yellow-800",
      CONFIRMADO: "bg-blue-100 text-blue-800",
      CANCELADO: "bg-red-100 text-red-800",
      CONCLUIDO: "bg-green-100 text-green-800",
    };
    return map[status] || "";
  };

  return (
    <div className="p-6 h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
        </Button>
      </div>
      <Card className="h-full">
        <CardContent className="p-0 h-full">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            popup
            messages={{
              today: "Hoje",
              previous: "Anterior",
              next: "Próximo",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
              date: "Data",
              time: "Hora",
              event: "Evento",
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="dialog-desc"><p id="dialog-desc" className="hidden">Formulário</p>
          <DialogHeader>
            <DialogTitle>
              {selected ? "Detalhes do Agendamento" : "Novo Agendamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selected ? (
              <div className="space-y-2">
                <p><strong>Cliente:</strong> {selected.cliente.nome}</p>
                <p><strong>Veículo:</strong> {selected.veiculo.modelo} - {selected.veiculo.placa}</p>
                <p><strong>Serviço:</strong> {selected.servico?.nome || "Não especificado"}</p>
                <p><strong>Técnico:</strong> {selected.tecnico?.nome || "Não atribuído"}</p>
                <p><strong>Data/Hora:</strong> {formatDateTime(selected.dataHora)}</p>
                <p><strong>Duração:</strong> {selected.duracao} min</p>
                <p><strong>Status:</strong> <Badge className={statusBadge(selected.status)}>{selected.status}</Badge></p>
                {selected.observacoes && <p><strong>Obs:</strong> {selected.observacoes}</p>}
                {selected.status !== "CANCELADO" && selected.status !== "CONCLUIDO" && (
                  <Button variant="destructive" onClick={() => handleCancel(selected.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <Select onValueChange={(v) => setNewAgendamento({ ...newAgendamento, clienteId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Veículo</Label>
                    <Select onValueChange={(v) => setNewAgendamento({ ...newAgendamento, veiculoId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {veiculos.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Serviço (opcional)</Label>
                    <Select onValueChange={(v) => setNewAgendamento({ ...newAgendamento, servicoId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {servicos.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Técnico (opcional)</Label>
                    <Select onValueChange={(v) => setNewAgendamento({ ...newAgendamento, tecnicoId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {tecnicos.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data/Hora</Label>
                    <Input
                      type="datetime-local"
                      value={newAgendamento.dataHora}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, dataHora: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Duração (minutos)</Label>
                    <Input
                      type="number"
                      value={newAgendamento.duracao}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, duracao: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input
                    value={newAgendamento.observacoes}
                    onChange={(e) => setNewAgendamento({ ...newAgendamento, observacoes: e.target.value })}
                  />
                </div>
                <Button onClick={handleSave}>Guardar</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
