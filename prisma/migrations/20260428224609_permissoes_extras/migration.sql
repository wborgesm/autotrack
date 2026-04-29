-- CreateEnum
CREATE TYPE "TipoOficina" AS ENUM ('CARROS', 'MOTOS', 'AMBOS');

-- DropForeignKey
ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "ordens_servico" DROP CONSTRAINT "ordens_servico_veiculoId_fkey";

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "lancamentos_financeiros" ADD COLUMN     "estadoFiscal" TEXT DEFAULT 'SEM_DOCUMENTO',
ADD COLUMN     "numFatura" TEXT;

-- AlterTable
ALTER TABLE "ordens_servico" ADD COLUMN     "estadoFiscal" TEXT DEFAULT 'SEM_DOCUMENTO',
ADD COLUMN     "numFatura" TEXT,
ALTER COLUMN "clienteId" DROP NOT NULL,
ALTER COLUMN "veiculoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pecas" ADD COLUMN     "quantidadeReservada" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "servicos" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "tecnicos" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "latitude" TEXT,
ADD COLUMN     "longitude" TEXT,
ADD COLUMN     "moloniCompanyId" TEXT,
ADD COLUMN     "moloniDevId" TEXT,
ADD COLUMN     "moloniEmail" TEXT,
ADD COLUMN     "moloniPass" TEXT,
ADD COLUMN     "moloniSecret" TEXT,
ADD COLUMN     "raioPermitido" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "tipoOficina" "TipoOficina" NOT NULL DEFAULT 'AMBOS',
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "traccar_servers" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "permissoesExtras" TEXT[],
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "veiculos" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "registros_tempo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "usuarioId" TEXT,
    "ordemId" TEXT,
    "tipo" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_tempo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaFraude" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "gravidade" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "entidadeId" TEXT,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertaFraude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alugueres" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "valorDiaria" DECIMAL(10,2) NOT NULL,
    "valorTotal" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alugueres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "abertura" TIMESTAMP(3) NOT NULL,
    "fechamento" TIMESTAMP(3),
    "saldoInicial" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "caixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "metodoPagamento" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venda_itens" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "qtd" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "venda_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encomenda" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT,
    "veiculoId" TEXT,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'ENCOMENDA_OFICINA',
    "dataPrevista" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "valorTotal" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encomenda_itens" (
    "id" TEXT NOT NULL,
    "encomendaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "qtd" INTEGER NOT NULL DEFAULT 1,
    "precoUnitario" DECIMAL(10,2),
    "pecaId" TEXT,
    "servicoId" TEXT,

    CONSTRAINT "encomenda_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_pecas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "ordemId" TEXT,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT,
    "nivel" TEXT,
    "pergunta" TEXT NOT NULL,
    "resposta" TEXT,
    "fonte" TEXT,
    "util" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registros_tempo_tenantId_tecnicoId_dataHora_idx" ON "registros_tempo"("tenantId", "tecnicoId", "dataHora");

-- CreateIndex
CREATE INDEX "registros_tempo_tenantId_usuarioId_dataHora_idx" ON "registros_tempo"("tenantId", "usuarioId", "dataHora");

-- CreateIndex
CREATE INDEX "registros_tempo_ordemId_idx" ON "registros_tempo"("ordemId");

-- CreateIndex
CREATE INDEX "chat_logs_tenantId_createdAt_idx" ON "chat_logs"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_tempo" ADD CONSTRAINT "registros_tempo_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_tempo" ADD CONSTRAINT "registros_tempo_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alugueres" ADD CONSTRAINT "alugueres_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alugueres" ADD CONSTRAINT "alugueres_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alugueres" ADD CONSTRAINT "alugueres_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venda_itens" ADD CONSTRAINT "venda_itens_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encomenda" ADD CONSTRAINT "Encomenda_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encomenda" ADD CONSTRAINT "Encomenda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encomenda" ADD CONSTRAINT "Encomenda_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda_itens" ADD CONSTRAINT "encomenda_itens_encomendaId_fkey" FOREIGN KEY ("encomendaId") REFERENCES "Encomenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda_itens" ADD CONSTRAINT "encomenda_itens_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda_itens" ADD CONSTRAINT "encomenda_itens_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_pecas" ADD CONSTRAINT "reservas_pecas_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_pecas" ADD CONSTRAINT "reservas_pecas_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
