"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export default function AgendaPage() {
  const { data: session } = useSession();
  const [eventos, setEventos] = useState([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch("/api/agendamentos")
      .then(r => r.json())
      .then(data => {
        setEventos(data);
        // Extrair lista de próximos agendamentos (ordenados por data)
        const proximos = data
          .filter((e: any) => new Date(e.start) >= new Date())
          .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
          .slice(0, 5);
        setAgendamentos(proximos);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda</h1>

      {/* Calendário */}
      <Card>
        <CardHeader><CardTitle>Calendário de Marcações</CardTitle></CardHeader>
        <CardContent>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={eventos}
            locales={[ptBrLocale]}
            locale="pt-br"
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="19:00:00"
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia"
            }}
          />
        </CardContent>
      </Card>

      {/* Próximos Agendamentos */}
      <Card>
        <CardHeader><CardTitle>Próximos Agendamentos</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-gray-500">A carregar...</p>}
          {!loading && agendamentos.length === 0 && (
            <p className="text-gray-500">Nenhum agendamento futuro encontrado.</p>
          )}
          {!loading && agendamentos.length > 0 && (
            <ul className="space-y-2">
              {agendamentos.map((ag: any) => (
                <li key={ag.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <p className="font-medium">{ag.title}</p>
                    <p className="text-sm text-gray-500">{formatDateTime(ag.start)}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {ag.extendedProps?.status || "PENDENTE"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
