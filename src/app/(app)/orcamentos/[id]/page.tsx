"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function OrcamentoDetalhePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [orcamento, setOrcamento] = useState<any>(null);

  useEffect(() => {
    if (session) fetch(`/api/orcamentos/${id}`).then(r => r.json()).then(setOrcamento);
  }, [session, id]);

  if (!orcamento) return <div className="p-6">A carregar...</div>;

  const subtotal = orcamento.itens.reduce((acc: number, i: any) => acc + i.total, 0);
  const iva = subtotal * 0.23;
  const total = subtotal + iva;

  // Logo personalizada do tenant ou fallback
  const logoUrl = orcamento.tenant?.logo || "https://autotrack.pt/gps/img/logoatpng.png";

  return (
    <div className="p-6">
      {/* Botão de impressão */}
      <div className="flex justify-end mb-4 no-print">
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Imprimir Orçamento
        </Button>
      </div>

      {/* Documento A4 */}
      <div className="max-w-[210mm] mx-auto bg-white dark:bg-gray-800 p-8 shadow-lg rounded-md print:shadow-none print:p-0">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-6">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-16 w-auto object-contain filter brightness(0) dark:brightness(100)" 
          />
          <div className="text-right text-sm text-gray-700 dark:text-gray-300">
            <strong>{orcamento.tenant?.nome || "Autotrack"}</strong><br />
            {orcamento.tenant?.endereco}<br />
            {orcamento.tenant?.telefone}<br />
            <small>{orcamento.tenant?.email}</small>
          </div>
        </div>

        {/* Título */}
        <div className="text-center my-6">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-900 dark:text-white">Orçamento</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Nº: {orcamento.numero} | Data: {new Date(orcamento.createdAt).toLocaleDateString('pt-PT')}</p>
        </div>

        {/* Dados do cliente e veículo */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 font-bold text-sm uppercase tracking-wide border-l-4 border-blue-600">Cliente</div>
            <p className="mt-2 text-sm"><strong>Nome:</strong> {orcamento.cliente?.nome}</p>
            {orcamento.cliente?.cpf && <p className="text-sm"><strong>NIF:</strong> {orcamento.cliente.cpf}</p>}
            <p className="text-sm"><strong>Tel:</strong> {orcamento.cliente?.telefone || "-"}</p>
          </div>
          <div>
            <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 font-bold text-sm uppercase tracking-wide border-l-4 border-blue-600">Veículo</div>
            {orcamento.veiculo ? (
              <>
                <p className="mt-2 text-sm"><strong>Moto/Veículo:</strong> {orcamento.veiculo.marca} {orcamento.veiculo.modelo}</p>
                <p className="text-sm"><strong>Matrícula:</strong> {orcamento.veiculo.placa}</p>
                <p className="text-sm"><strong>Kms:</strong> {orcamento.veiculo.km || "-"}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Não especificado</p>
            )}
          </div>
        </div>

        {/* Tabela de itens */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-2 text-left text-sm font-semibold">Descrição</th>
              <th className="p-2 text-right text-sm font-semibold w-32">Preço Base</th>
            </tr>
          </thead>
          <tbody>
            {orcamento.itens.map((item: any, idx: number) => (
              <tr key={idx} className="border-b dark:border-gray-600">
                <td className="p-2 text-sm">{item.servico?.nome || item.peca?.nome || "-"}</td>
                <td className="p-2 text-right text-sm">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totais */}
        <div className="flex flex-col items-end">
          <div className="grid grid-cols-[140px_120px] gap-1 text-right text-sm">
            <span>Subtotal:</span> <span>{formatCurrency(subtotal)}</span>
            <span>IVA (23%):</span> <span>{formatCurrency(iva)}</span>
          </div>
          <div className="grid grid-cols-[140px_120px] gap-1 text-right text-lg font-bold border-t-2 dark:border-gray-600 mt-2 pt-2">
            <span>TOTAL:</span> <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-10 text-xs text-gray-600 dark:text-gray-400 border-t dark:border-gray-600 pt-4">
          <p><strong>Observações:</strong></p>
          <p>1. Este orçamento é válido por 8 dias úteis.</p>
          <p>2. O valor total é uma estimativa, podendo variar caso surjam imprevistos técnicos durante a reparação.</p>
          <div className="flex justify-between mt-10 text-center">
            <div className="w-48 border-t dark:border-gray-500 pt-2">Pela Oficina</div>
            <div className="w-48 border-t dark:border-gray-500 pt-2">Assinatura Cliente</div>
          </div>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
