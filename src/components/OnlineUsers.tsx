"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function OnlineUsers() {
  const { data: session } = useSession();
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.nivel === "SUPER_ADMIN") {
      fetch("/api/admin/online").then(r => r.json()).then(setDados).catch(() => {});
    }
  }, [session]);

  if (!session || session.user.nivel !== "SUPER_ADMIN" || !dados) return null;

  return (
    <Card className="glass">
      <CardHeader><CardTitle>Utilizadores Online (últimos 5 min)</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-2">{dados.online} online</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Oficina</TableHead>
              <TableHead>Navegador</TableHead>
              <TableHead>S.O.</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Última atividade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(dados.sessoes || []).map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="text-xs">
                  <span className="font-medium">{s.usuario}</span>
                  <Badge variant="outline" className="ml-1 text-[10px]">{s.nivel}</Badge>
                </TableCell>
                <TableCell className="text-xs">{s.tenant}</TableCell>
                <TableCell className="text-xs">{s.browser}</TableCell>
                <TableCell className="text-xs">{s.os}</TableCell>
                <TableCell className="text-xs font-mono">{s.ip}</TableCell>
                <TableCell className="text-xs">{new Date(s.ultimaAtividade).toLocaleTimeString("pt-PT")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
