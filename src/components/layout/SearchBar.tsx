"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResult {
  type: "cliente" | "veiculo" | "ordem" | "orcamento" | "aluguer";
  id: string;
  title: string;
  subtitle?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 1) { setResults([]); setOpen(false); return; }
    setLoading(true);
    fetch(`/api/busca?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { setResults(Array.isArray(d) ? d : []); setOpen(true); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSelect = (r: SearchResult) => {
    const pathMap: Record<string, string> = { cliente: "/clientes", veiculo: "/veiculos", ordem: "/ordens", orcamento: "/orcamentos", aluguer: "/alugueres" };
    router.push(`${pathMap[r.type]}/${r.id}`);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search" placeholder="Buscar cliente, veículo, OS..." value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10 pr-8 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-full text-sm"
        />
        {query && <button onClick={() => { setQuery(""); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-gray-400" /></button>}
      </div>
      {open && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden max-h-80 overflow-y-auto">
          {loading && <div className="p-4 text-center text-sm text-gray-500">A procurar...</div>}
          {!loading && results.length === 0 && query.length >= 1 && <div className="p-4 text-center text-sm text-gray-500">Nenhum resultado.</div>}
          {!loading && results.map(r => (
            <button key={`${r.type}-${r.id}`} onClick={() => handleSelect(r)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors flex items-center gap-3">
              <span className="text-xs font-medium uppercase bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{r.type}</span>
              <div><p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>{r.subtitle && <p className="text-xs text-gray-500">{r.subtitle}</p>}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
