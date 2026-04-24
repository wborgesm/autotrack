"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export default function AuditoriaPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      fetch("/api/auditoria")
        .then(r => r.json())
        .then(data => {
          console.log("Resposta da auditoria:", data);
          if (Array.isArray(data)) {
            setLogs(data);
          } else if (data && Array.isArray(data.logs)) {
            setLogs(data.logs);
          } else {
            setLogs([]);
            setError("Formato de resposta inesperado.");
          }
        })
        .catch(err => {
          console.error(err);
          setError("Erro ao carregar auditoria.");
        });
    }
  }, [session]);

  if (!["SUPER_ADMIN", "ADMIN"].includes(session?.user?.nivel || "")) {
    return <div className="p-6">Acesso restrito.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoria do Sistema</h1>
      {error && <p className="text-red-500">{error}</p>}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader><CardTitle className="text-gray-900 dark:text-white">Registo de Alterações</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-600 dark:text-gray-400">Data/Hora</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Utilizador</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Ação</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Entidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id} className="border-gray-200 dark:border-gray-700">
                  <TableCell className="text-gray-900 dark:text-gray-200">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{log.usuarioNome}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{log.acao}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-200">{log.entidade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
