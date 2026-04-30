"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Wallet, CreditCard, Smartphone, Building, Receipt, Printer, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TotaisSistema {
  dinheiro: number;
  cartao: number;
  mbway: number;
  transferencia: number;
  referencia_mb: number;
}

export default function FecharCaixaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [caixaId, setCaixaId] = useState("");
  const [totaisSistema, setTotaisSistema] = useState<TotaisSistema>({
    dinheiro: 0, cartao: 0, mbway: 0, transferencia: 0, referencia_mb: 0,
  });
  const [contagemReal, setContagemReal] = useState<TotaisSistema>({
    dinheiro: 0, cartao: 0, mbway: 0, transferencia: 0, referencia_mb: 0,
  });
  const [justificativa, setJustificativa] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Buscar status do caixa e totais do sistema
    fetch("/api/caixa/status").then(r => r.json()).then(d => {
      if (!d.aberto) {
        alert("Não há caixa aberto.");
        router.push("/caixa");
        return;
      }
      setCaixaId(d.caixaId);
      // Buscar totais das vendas do dia
      fetch(`/api/caixa/totais?caixaId=${d.caixaId}`)
        .then(r => r.json())
        .then(setTotaisSistema);
    });
  }, [router]);

  const calcularDiferenca = (metodo: keyof TotaisSistema) => {
    return contagemReal[metodo] - totaisSistema[metodo];
  };

  const getCorDiferenca = (metodo: keyof TotaisSistema) => {
    const diff = calcularDiferenca(metodo);
    if (diff === 0) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (diff > 0) return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
    return "text-red-600 bg-red-50 dark:bg-red-900/20";
  };

  const totalSistema = Object.values(totaisSistema).reduce((a, b) => a + b, 0);
  const totalContado = Object.values(contagemReal).reduce((a, b) => a + b, 0);
  const diferencaGeral = totalContado - totalSistema;

  const handleFechar = async () => {
    // Validação de diferença > 5€ sem justificativa
    if (Math.abs(diferencaGeral) > 5 && !justificativa.trim()) {
      alert("Diferença superior a 5€. É obrigatório justificar.");
      return;
    }
    if (!confirm("Confirmar fecho do caixa?")) return;
    setLoading(true);
    await fetch("/api/caixa/fechar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caixaId,
        contagemReal,
        diferenca: diferencaGeral,
        justificativa: justificativa || undefined,
      }),
    });
    alert("Caixa fechado com sucesso.");
    router.push("/caixa");
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 no-print">
      {/* Botão voltar */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 no-print">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Caixa
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fechamento de Caixa</h1>

      {/* Cartões de reconciliação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { key: "dinheiro", label: "Dinheiro", icon: <Wallet className="h-5 w-5" /> },
          { key: "cartao", label: "Cartão", icon: <CreditCard className="h-5 w-5" /> },
          { key: "mbway", label: "MB WAY", icon: <Smartphone className="h-5 w-5" /> },
          { key: "transferencia", label: "Transferência", icon: <Building className="h-5 w-5" /> },
          { key: "referencia_mb", label: "Ref. Multibanco", icon: <Receipt className="h-5 w-5" /> },
        ].map(m => (
          <Card key={m.key}>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              {m.icon}
              <CardTitle className="text-sm">{m.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs">Sistema</Label>
                <p className="text-lg font-mono">€ {totaisSistema[m.key as keyof TotaisSistema].toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-xs">Contagem Real</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={contagemReal[m.key as keyof TotaisSistema]}
                  onChange={e => setContagemReal(prev => ({ ...prev, [m.key]: parseFloat(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div className={cn("text-sm font-medium rounded px-2 py-1", getCorDiferenca(m.key as keyof TotaisSistema))}>
                {calcularDiferenca(m.key as keyof TotaisSistema) === 0 ? "✓ Certo" :
                 calcularDiferenca(m.key as keyof TotaisSistema) > 0 ? `+ € ${calcularDiferenca(m.key as keyof TotaisSistema).toFixed(2)}` :
                 `- € ${Math.abs(calcularDiferenca(m.key as keyof TotaisSistema)).toFixed(2)}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo e diferença geral */}
      <Card className="glass">
        <CardHeader><CardTitle>Resumo Geral</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Sistema</p>
            <p className="text-2xl font-bold">€ {totalSistema.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contado</p>
            <p className="text-2xl font-bold">€ {totalContado.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Diferença</p>
            <p className={cn("text-2xl font-bold", diferencaGeral === 0 ? "text-green-600" : diferencaGeral > 0 ? "text-blue-600" : "text-red-600")}>
              {diferencaGeral === 0 ? "0.00" : diferencaGeral > 0 ? `+ € ${diferencaGeral.toFixed(2)}` : `- € ${Math.abs(diferencaGeral).toFixed(2)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Justificativa (se diferença > 5€) */}
      {Math.abs(diferencaGeral) > 5 && (
        <Card className="glass border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Justificativa Obrigatória
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Explique a diferença (obrigatório para mais de 5€)</Label>
            <Input
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              placeholder="Ex: erro de troco, esquecimento de registo..."
              className="mt-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Botões de ação */}
      <div className="flex gap-4 no-print">
        <Button onClick={handleFechar} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
          {loading ? "A fechar..." : "Confirmar Fecho de Caixa"}
        </Button>
        <Button variant="outline" onClick={imprimir}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir Resumo
        </Button>
      </div>

      {/* Versão de impressão (aparece só na impressão) */}
      <div className="hidden print:block">
        <h2 className="text-xl font-bold">Fecho de Caixa</h2>
        <p className="text-sm text-gray-500">Data: {new Date().toLocaleDateString("pt-PT")}</p>
        <table className="w-full mt-4 border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Método</th>
              <th className="text-right p-2">Sistema</th>
              <th className="text-right p-2">Real</th>
              <th className="text-right p-2">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(totaisSistema).map(k => (
              <tr key={k} className="border-b">
                <td className="p-2">{k}</td>
                <td className="text-right p-2">€ {(totaisSistema[k as keyof TotaisSistema] || 0).toFixed(2)}</td>
                <td className="text-right p-2">€ {(contagemReal[k as keyof TotaisSistema] || 0).toFixed(2)}</td>
                <td className="text-right p-2">€ {calcularDiferenca(k as keyof TotaisSistema).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4">Assinatura: ___________________________</p>
      </div>
    </div>
  );
}
