"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

export default function AgendaPage() {
  const { data: session } = useSession();
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/agendamentos")
      .then(r => r.json())
      .then(setEventos)
      .catch(console.error);
  }, [session]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agenda</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        events={eventos}
        
        
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="19:00:00"
      />
    </div>
  );
}
