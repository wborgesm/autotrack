"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CaixaModal() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [adiamentos, setAdiamentos] = useState(0);
  const [ultimoAdiamento, setUltimoAdiamento] = useState<number | null>(null);

  useEffect(() => {
    // Verifica se o caixa está aberto
    fetch("/api/caixa/status").then(r => r.json()).then(d => {
      if (!d.aberto) {
        // Carregar adiamentos do localStorage
        const saved = localStorage.getItem("caixa_adiamentos");
        const savedTime = localStorage.getItem("caixa_ultimo_adiamento");
        if (saved) {
          const ad = parseInt(saved);
          setAdiamentos(ad);
          if (savedTime) setUltimoAdiamento(parseInt(savedTime));
          // Se já adiou 3 vezes, mostra o modal imediatamente
          if (ad >= 3) {
            setShow(true);
          } else if (savedTime && Date.now() - parseInt(savedTime) > 10 * 60 * 1000) {
            // Se passaram 10 min desde o último adiamento, mostra
            setShow(true);
          } else {
            // Se está dentro do período de adiamento, não mostra
            setShow(false);
          }
        } else {
          setShow(true); // primeira vez, mostra
        }
      } else {
        setShow(false);
      }
    });
  }, [session]);

  const handleAbrirCaixa = () => {
    window.location.href = "/caixa";
  };

  const handleAdiar = () => {
    if (adiamentos < 3) {
      const novoAd = adiamentos + 1;
      setAdiamentos(novoAd);
      localStorage.setItem("caixa_adiamentos", novoAd.toString());
      const now = Date.now();
      localStorage.setItem("caixa_ultimo_adiamento", now.toString());
      setUltimoAdiamento(now);
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 glass">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Abertura de Caixa Obrigatória</h2>
          <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Para utilizar o sistema, é necessário abrir o caixa. Se não deseja abrir agora, pode adiar por 10 minutos (máximo 3 adiamentos).
        </p>
        <div className="flex gap-3">
          <Button onClick={handleAbrirCaixa} className="flex-1 bg-green-600 hover:bg-green-700">
            Abrir Caixa
          </Button>
          {adiamentos < 3 && (
            <Button variant="outline" onClick={handleAdiar} className="flex-1">
              Adiar 10 min ({3 - adiamentos} restantes)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
