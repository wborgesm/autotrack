"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Mensagem {
  tipo: "user" | "bot";
  texto: string;
}

export default function FloatingChat() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);
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
      setShowAlert(data.alert === true);
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
    <>
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {aberto && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[90vw] h-[520px] max-h-[70vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Assistente AutoTrack</span>
            </div>
            <button onClick={() => setAberto(false)} className="hover:bg-blue-700 rounded-full p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Alerta de limite */}
          {showAlert && remaining && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Restam apenas {remaining} pedidos hoje.</span>
            </div>
          )}

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensagens.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-4">
                <Bot className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p>👋 Olá! Sou o assistente do AutoTrack.</p>
                <p className="text-xs mt-1">Pergunta-me como usar qualquer módulo.</p>
                {remaining && remaining <= 50 && (
                  <p className="text-xs text-red-500 mt-2">⚠️ Apenas {remaining} pedidos restantes hoje.</p>
                )}
              </div>
            )}
            {mensagens.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.tipo === "user" ? "justify-end" : "justify-start"}`}>
                {msg.tipo === "bot" && (
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1.5 shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-sm ${
                  msg.tipo === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.texto}</p>
                </div>
                {msg.tipo === "user" && (
                  <div className="bg-blue-600 rounded-full p-1.5 shrink-0 mt-1">
                    <User className="h-4 w-4 text-white" />
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
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 shrink-0 flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={remaining && remaining <= 0 ? "Limite diário atingido..." : "Pergunta algo..."}
              className="flex-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
              disabled={remaining !== null && remaining <= 0}
            />
            <Button size="sm" onClick={enviar} disabled={loading || !input.trim() || (remaining !== null && remaining <= 0)} className="bg-blue-600">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
