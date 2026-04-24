"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export default function AuditoriaPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    
    // Só SUPER_ADMIN pode ver
    if (session.user.nivel !== "SUPER_ADMIN") {
      setLoading(false);
      return;
    }
    
    fetch("/api/auditoria")
      .then(r => {
        if (!r.ok) throw new Error("Acesso negado");
        return r.json();
      })
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => {
        setLogs([]);
        setLoading(false);
      });
  }, [session]);

  if (!session) return <div className="p-6">A carregar...</div>;

  // Apenas SUPER_ADMIN tem acesso
  if (session.user.nivel !== "SUPER_ADMIN") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso Restrito</h1>
        <p className="text-gray-500">Esta área é exclusiva para administradores do sistema (SUPER_ADMIN).</p>
      </div>
    );
  }

  if (loading) return <div className="p-6">A carregar...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoria do Sistema</h1>
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
