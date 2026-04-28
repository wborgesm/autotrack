"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MessageCircle, HelpCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export default function ChatAnalyticsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [filtro, setFiltro] = useState("todos");
  const [topPerguntas, setTopPerguntas] = useState<any[]>([]);

  useEffect(() => {
    if (!session || session.user.nivel !== "SUPER_ADMIN") return;
    fetch("/api/chatbot/logs")
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs || []);
        setStats(data.stats || {});
      });

    fetch("/api/chatbot/logs?top=10")
      .then(r => r.json())
      .then(data => setTopPerguntas(data.topPerguntas || []));
  }, [session, filtro]);

  if (session?.user.nivel !== "SUPER_ADMIN") {
    return <div className="p-6 text-gray-900 dark:text-white">Acesso restrito ao SUPER_ADMIN.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-blue-600" /> Análise do Chatbot
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6 text-center">
            <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalPerguntas || 0}</p>
            <p className="text-xs text-gray-500">Total de Perguntas</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.respondidas || 0}</p>
            <p className="text-xs text-gray-500">Respondidas</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.naoRespondidas || 0}</p>
            <p className="text-xs text-gray-500">Sem Resposta</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6 text-center">
            <HelpCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.comIA || 0}</p>
            <p className="text-xs text-gray-500">Com IA (Gemini)</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{stats.taxaResolucao || 0}%</p>
            <p className="text-xs text-gray-500">Taxa de Resolução</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{stats.totalUtilizadores || 0}</p>
            <p className="text-xs text-gray-500">Utilizadores Únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Perguntas */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader><CardTitle>📊 Perguntas Mais Frequentes</CardTitle></CardHeader>
        <CardContent>
          {topPerguntas.length === 0 && <p className="text-gray-500 text-sm">Sem dados.</p>}
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topPerguntas} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="pergunta" tick={{ fontSize: 11 }} width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>📝 Registo de Interações</CardTitle>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="conhecimento">Conhecimento</SelectItem>
              <SelectItem value="gemini">Gemini (IA)</SelectItem>
              <SelectItem value="sem_resposta">Sem resposta</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Utilizador</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Pergunta</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Útil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell className="text-xs">{log.usuarioNome}</TableCell>
                  <TableCell className="text-xs"><Badge variant="outline">{log.nivel}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{log.pergunta}</TableCell>
                  <TableCell className="text-xs">
                    {log.fonte === "gemini" ? <Badge className="bg-purple-600">IA</Badge> : <Badge className="bg-blue-600">Conhecimento</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.util === true ? "✅" : log.util === false ? "❌" : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
