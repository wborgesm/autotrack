"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MessageCircle, HelpCircle, CheckCircle, XCircle, TrendingUp, ThumbsUp, ThumbsDown, AlertTriangle, Zap } from "lucide-react";

export default function ChatAnalyticsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [filtro, setFiltro] = useState("todos");
  const [filtroUtil, setFiltroUtil] = useState("todos");
  const [topPerguntas, setTopPerguntas] = useState<any[]>([]);
  const [orfas, setOrfas] = useState<any[]>([]);

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

    // Carregar órfãs
    fetch("/api/chatbot/sugestoes")
      .then(r => r.json())
      .then(data => setOrfas(data || []));
  }, [session, filtro]);

  const logsFiltrados = logs.filter((log: any) => {
    if (filtroUtil === "util" && log.util !== true) return false;
    if (filtroUtil === "nao_util" && log.util !== false) return false;
    return true;
  });

  const feedbackData = [
    { name: "Úteis", value: logs.filter(l => l.util === true).length, color: "#22c55e" },
    { name: "Não úteis", value: logs.filter(l => l.util === false).length, color: "#ef4444" },
    { name: "Sem feedback", value: logs.filter(l => l.util === null).length, color: "#9ca3af" },
  ];

  const taxaAcerto = stats.totalPerguntas > 0
    ? ((stats.totalPerguntas - (stats.naoRespondidas || 0)) / stats.totalPerguntas * 100).toFixed(1)
    : "0";

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
            <Zap className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{taxaAcerto}%</p>
            <p className="text-xs text-gray-500">Taxa de Acerto (Regras)</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{stats.totalUtilizadores || 0}</p>
            <p className="text-xs text-gray-500">Utilizadores Únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback e gráfico de satisfação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader><CardTitle>👍 Feedback dos Utilizadores</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={feedbackData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {feedbackData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-1"><ThumbsUp className="h-4 w-4 text-green-500" /> Úteis ({feedbackData[0].value})</div>
              <div className="flex items-center gap-1"><ThumbsDown className="h-4 w-4 text-red-500" /> Não úteis ({feedbackData[1].value})</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400" /> Sem feedback ({feedbackData[2].value})</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader><CardTitle>⚠️ Perguntas com 👎 (Precisam de Melhoria)</CardTitle></CardHeader>
          <CardContent>
            {logs.filter(l => l.util === false).slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex items-start gap-2 mb-2 p-2 bg-red-50 dark:bg-red-900/10 rounded">
                <ThumbsDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-800 dark:text-gray-200">{log.pergunta}</p>
                  <p className="text-[10px] text-gray-500">Respondido: {log.resposta?.slice(0, 80)}...</p>
                </div>
              </div>
            ))}
            {logs.filter(l => l.util === false).length === 0 && <p className="text-xs text-gray-500">Nenhuma pergunta com feedback negativo.</p>}
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

      {/* 🔴 Perguntas órfãs (sem match) */}
      <Card className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" /> Perguntas sem resposta (órfãs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orfas.length === 0 && <p className="text-sm text-gray-500">Tudo sob controlo! 🎉</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead className="text-right">Ocorrências</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orfas.map((item: any) => (
                <TableRow key={item.pergunta}>
                  <TableCell className="text-xs">{item.pergunta}</TableCell>
                  <TableCell className="text-xs text-right">{item._count.pergunta}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Enviar para uma rota que sugere a adição da regra
                        const chave = prompt("Nova chave (separada por vírgulas):", item.pergunta);
                        if (chave) {
                          fetch("/api/chatbot/adicionar-regra", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              chaves: chave.split(",").map(s => s.trim()),
                              resposta: "",
                              modoAula: prompt("ID da aula (opcional):"),
                            }),
                          }).then(r => r.json()).then(d => alert(d.message || "Regra adicionada!"));
                        }
                      }}
                    >
                      Adicionar ao chatbot
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>📝 Registo de Interações</CardTitle>
          <div className="flex gap-2">
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="conhecimento">Conhecimento</SelectItem>
                <SelectItem value="gemini">Gemini (IA)</SelectItem>
                <SelectItem value="sem_resposta">Sem resposta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroUtil} onValueChange={setFiltroUtil}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os feedbacks</SelectItem>
                <SelectItem value="util">Úteis 👍</SelectItem>
                <SelectItem value="nao_util">Não úteis 👎</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <TableHead>Match</TableHead>
                <TableHead>Útil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsFiltrados.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell className="text-xs">{log.usuarioNome}</TableCell>
                  <TableCell className="text-xs"><Badge variant="outline">{log.nivel}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{log.pergunta}</TableCell>
                  <TableCell className="text-xs">
                    {log.fonte === "gemini" ? <Badge className="bg-purple-600">IA</Badge> : <Badge className="bg-blue-600">Conhecimento</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">{log.matched ? "✅" : "❌"}</TableCell>
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
