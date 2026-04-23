/*
  Warnings:

  - You are about to drop the `pending_tenants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "pending_tenants";

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "veiculoId" TEXT,
    "numero" INTEGER NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento_itens" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "servicoId" TEXT,
    "pecaId" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "valorUnit" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "orcamento_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "ordemId" TEXT,
    "orcamentoId" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "iva" DECIMAL(5,2) NOT NULL DEFAULT 23,
    "nifEmpresa" TEXT NOT NULL,
    "emitida" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_tenantId_numero_key" ON "orcamentos"("tenantId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "faturas_orcamentoId_key" ON "faturas"("orcamentoId");

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_itens" ADD CONSTRAINT "orcamento_itens_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_itens" ADD CONSTRAINT "orcamento_itens_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_itens" ADD CONSTRAINT "orcamento_itens_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
