"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TesteSMSPage() {
  const { data: session } = useSession();
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const enviar = async () => {
    if (!telefone || !mensagem) {
      setResultado("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch("/api/testes/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, mensagem }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultado("✅ SMS enviado com sucesso! ID: " + (data.messageId || "—"));
      } else {
        setResultado("❌ Erro: " + (data.error || "Falha no envio"));
      }
    } catch {
      setResultado("❌ Erro de rede.");
    } finally {
      setLoading(false);
    }
  };

  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.nivel)) {
    return <div className="p-6">Acesso restrito.</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Teste de Envio de SMS</h1>
      <Card>
        <CardHeader><CardTitle>Gateway Autotrack SMS</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Telefone</Label>
            <Input
              placeholder="+351934157992"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
          <div>
            <Label>Mensagem</Label>
            <Input
              placeholder="Mensagem de teste..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </div>
          <Button onClick={enviar} disabled={loading}>
            {loading ? "A enviar..." : "Enviar SMS"}
          </Button>
          {resultado && (
            <p className="text-sm font-medium">{resultado}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
