"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, User, MapPin } from "lucide-react";

interface Agendamento {
  id: string;
  cliente: { nome: string };
  veiculo: { placa: string };
  servico: { nome: string };
  tecnico: { nome: string };
  dataHora: string;
  status: string;
}

export default function AgendaPage() {
  const { data: session } = useSession();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  useEffect(() => {
    fetch("/api/agendamentos").then(r => r.json()).then(d => setAgendamentos(d.agendamentos || d));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMADO": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "PENDENTE": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "CANCELADO": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agendamentos.length === 0 && <p className="text-gray-500">Nenhum agendamento para hoje.</p>}
        {agendamentos.map((ag) => (
          <Card key={ag.id} className="glass hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{ag.cliente.nome}</CardTitle>
                <Badge className={getStatusColor(ag.status)}>{ag.status}</Badge>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {new Date(ag.dataHora).toLocaleDateString("pt-PT", { year: "numeric", month: "short", day: "numeric" })}
                <Clock className="h-4 w-4 ml-2" />
                {new Date(ag.dataHora).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1"><User className="h-4 w-4" /> {ag.tecnico.nome}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {ag.veiculo.placa}</span>
              </div>
              <p className="text-xs text-gray-500">{ag.servico.nome}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
