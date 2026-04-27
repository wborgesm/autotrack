"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";

export default function OrdemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [ordem, setOrdem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !session) return;
    fetch(`/api/ordens/${id}`).then(r => r.json()).then(data => { setOrdem(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id, session]);

  const emitirFatura = async () => {
    const res = await fetch("/api/fiscal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ordemId: ordem.id }) });
    if (res.ok) { const data = await res.json(); alert(`Fatura ${data.numeroFatura} emitida!`); }
    else { const err = await res.json(); alert(err.error || "Erro"); }
  };

  if (loading) return <p className="p-6">A carregar...</p>;
  if (!ordem) return <p className="p-6">Ordem não encontrada.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/ordens"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button></Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>OS #{ordem.numero}</span>
            <Badge>{ordem.status}</Badge>
          </CardTitle>
          <p className="text-sm text-gray-500">Cliente: {ordem.cliente?.nome} | Veículo: {ordem.veiculo?.placa} {ordem.veiculo?.modelo}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-blue-50 text-blue-700" onClick={emitirFatura}><Receipt className="mr-2 h-4 w-4" /> Emitir Fatura</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Total Mão de Obra:</strong> {formatCurrency(ordem.totalMaoObra)}</div>
            <div><strong>Total Peças:</strong> {formatCurrency(ordem.totalPecas)}</div>
            <div><strong>Total:</strong> {formatCurrency(ordem.total)}</div>
            <div><strong>Criado em:</strong> {formatDate(ordem.createdAt)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
