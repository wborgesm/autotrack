"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Brain, ThumbsUp, ThumbsDown, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { saudacoes, processando, aleatorio } from "@/lib/chatbot-frases";

interface Mensagem {
  tipo: "user" | "bot";
  texto: string;
  fonte?: "conhecimento" | "gemini";
  avaliada?: boolean;
}

export default function FloatingChat() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [falhasSeguidas, setFalhasSeguidas] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  // Saudação ao abrir
  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      setMensagens([{ tipo: "bot", texto: aleatorio(saudacoes), fonte: "conhecimento" }]);
    }
  }, [aberto]);

  const avaliar = (idx: number, util: boolean) => {
    setMensagens(prev => prev.map((m, i) => i === idx ? { ...m, avaliada: true } : m));
    const msg = mensagens[idx];
    if (msg && msg.fonte === "bot") {
      fetch("/api/chatbot/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: mensagens[idx - 1]?.texto || "", resposta: msg.texto, util }),
      }).catch(() => {});
    }
  };

  const enviar = async (forcarIA: boolean = false) => {
    if (!input.trim() && !forcarIA) return;
    const pergunta = forcarIA ? mensagens[mensagens.length - 1]?.texto || input : input;
    if (!pergunta.trim()) return;
    
    if (!forcarIA) {
      setInput("");
      setMensagens(prev => [...prev, { tipo: "user", texto: pergunta }]);
    }
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta, usarIA: forcarIA ? true : false }),
      });
      const data = await res.json();
      
      setMensagens(prev => [...prev, {
        tipo: "bot",
        texto: data.resposta || "Erro ao obter resposta.",
        fonte: data.fonte || "conhecimento"
      }]);
      
      if (data.precisaIA === true) {
        setFalhasSeguidas(prev => prev + 1);
        if (falhasSeguidas >= 2) {
          setTimeout(() => {
            setMensagens(prev => [...prev, { tipo: "bot", texto: "🔄 A pesquisar com IA avançada..." }]);
            enviar(true);
          }, 500);
        }
      } else {
        setFalhasSeguidas(0);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setMensagens(prev => [...prev, { tipo: "bot", texto: "Erro de rede.", fonte: "conhecimento" }]);
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
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {aberto && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[90vw] h-[560px] max-h-[75vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Assistente AutoTrack</span>
              <Badge className="bg-yellow-500 text-yellow-900 text-[10px] px-1.5 py-0 ml-1 flex items-center gap-1">
                <FlaskConical className="h-3 w-3" /> BETA
              </Badge>
            </div>
            <button onClick={() => setAberto(false)} className="hover:bg-blue-700 rounded-full p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensagens.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-1 ${msg.tipo === "user" ? "items-end" : "items-start"}`}>
                <div className={`flex gap-2 ${msg.tipo === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.tipo === "bot" && (
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1.5 shrink-0 mt-1">
                      {msg.fonte === "gemini" ? <Brain className="h-4 w-4 text-purple-600" /> : <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                  )}
                  <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-sm ${
                    msg.tipo === "user"
                      ? "bg-blue-600 text-white"
                      : msg.fonte === "gemini"
                      ? "bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-gray-900 dark:text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}>
                    <p className="whitespace-pre-wrap text-xs">{msg.texto}</p>
                    {msg.fonte === "gemini" && (
                      <p className="text-[10px] text-purple-500 mt-1">🤖 Resposta via IA (Gemini)</p>
                    )}
                  </div>
                  {msg.tipo === "user" && (
                    <div className="bg-blue-600 rounded-full p-1.5 shrink-0 mt-1">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                {/* Botões de avaliação */}
                {msg.tipo === "bot" && !msg.avaliada && idx > 0 && (
                  <div className="flex items-center gap-2 ml-10">
                    <button
                      onClick={() => avaliar(idx, true)}
                      className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Útil"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => avaliar(idx, false)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Não útil"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {msg.tipo === "bot" && msg.avaliada && (
                  <p className="text-[10px] text-gray-400 ml-10">Obrigado pelo feedback!</p>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm pl-8">
                <Loader2 className="h-4 w-4 animate-spin" /> {aleatorio(processando)}
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
              placeholder="Pergunta algo..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
            />
            <Button size="sm" onClick={() => enviar()} disabled={loading || !input.trim()} className="bg-blue-600">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
