import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface FiltrosTabelaProps {
  pesquisa: string;
  onPesquisaChange: (v: string) => void;
  filtrosActivos: boolean;
  onLimpar: () => void;
  children?: React.ReactNode;
}

export function FiltrosTabela({ pesquisa, onPesquisaChange, filtrosActivos, onLimpar, children }: FiltrosTabelaProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Pesquisar..."
          value={pesquisa}
          onChange={e => onPesquisaChange(e.target.value)}
          className="pl-9"
        />
      </div>
      {children}
      {filtrosActivos && (
        <Button variant="outline" size="sm" onClick={onLimpar}>
          <X className="h-4 w-4 mr-1" /> Limpar filtros
        </Button>
      )}
    </div>
  );
}
