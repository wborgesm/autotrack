"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, AlertTriangle } from "lucide-react";

interface Mensagem {
  tipo: "user" | "bot";
  texto: string;
}

export default function ChatbotPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviar = async () => {
    if (!input.trim()) return;
    const pergunta = input;
    setInput("");
    setMensagens(prev => [...prev, { tipo: "user", texto: pergunta }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta }),
      });
      const data = await res.json();
      setMensagens(prev => [...prev, { tipo: "bot", texto: data.resposta || "Erro ao obter resposta." }]);
      setRemaining(data.remaining ?? null);
    } catch {
      setMensagens(prev => [...prev, { tipo: "bot", texto: "Erro de rede." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Bot className="h-6 w-6 text-blue-600" /> Assistente AutoTrack
      </h1>

      {remaining !== null && remaining <= 50 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2 mb-4 flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Restam apenas {remaining} pedidos hoje.</span>
        </div>
      )}

      <Card className="flex-1 overflow-y-auto mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="space-y-4 p-4">
          {mensagens.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <Bot className="h-12 w-12 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">👋 Olá! Sou o assistente virtual do AutoTrack.</p>
              <p className="text-sm mt-1">Pergunta-me como funciona qualquer módulo do sistema.</p>
            </div>
          )}
          {mensagens.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.tipo === "user" ? "justify-end" : "justify-start"}`}>
              {msg.tipo === "bot" && (
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 shrink-0">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm ${
                msg.tipo === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              }`}>
                <p className="whitespace-pre-wrap">{msg.texto}</p>
              </div>
              {msg.tipo === "user" && (
                <div className="bg-blue-600 rounded-full p-2 shrink-0">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm pl-8">
              <Loader2 className="h-4 w-4 animate-spin" /> A pensar...
            </div>
          )}
          <div ref={scrollRef} />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunta algo sobre o AutoTrack..."
          className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          disabled={remaining !== null && remaining <= 0}
        />
        <Button onClick={enviar} disabled={loading || !input.trim() || (remaining !== null && remaining <= 0)} className="bg-blue-600">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
