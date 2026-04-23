-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('STARTER', 'PROFISSIONAL', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "NivelAcesso" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'TECNICO', 'RECEPCIONISTA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoVeiculo" AS ENUM ('CARRO', 'MOTO', 'UTILITARIO', 'CAMINHAO');

-- CreateEnum
CREATE TYPE "StatusOrdem" AS ENUM ('ABERTA', 'EM_DIAGNOSTICO', 'AGUARDANDO_PECAS', 'EM_SERVICO', 'TESTE_FINAL', 'PRONTA', 'ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO', 'NAO_COMPARECEU');

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TipoTransacaoPontos" AS ENUM ('CREDITO', 'DEBITO', 'EXPIRACAO');

-- CreateEnum
CREATE TYPE "NivelFidelidade" AS ENUM ('BRONZE', 'PRATA', 'OURO', 'PLATINA');

-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('UN', 'L', 'ML', 'KG', 'G', 'M', 'PAR', 'JG');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "logo" TEXT,
    "plano" "Plano" NOT NULL DEFAULT 'STARTER',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "addonGps" BOOLEAN NOT NULL DEFAULT false,
    "addonPontos" BOOLEAN NOT NULL DEFAULT false,
    "addonWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "addonPortalCliente" BOOLEAN NOT NULL DEFAULT false,
    "traccarUrl" TEXT,
    "traccarPort" INTEGER,
    "traccarUser" TEXT,
    "traccarPass" TEXT,
    "pontosPorReal" INTEGER NOT NULL DEFAULT 10,
    "bonusMoto" INTEGER NOT NULL DEFAULT 15,
    "minimoResgate" INTEGER NOT NULL DEFAULT 500,
    "validadeMeses" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nivel" "NivelAcesso" NOT NULL DEFAULT 'CLIENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoVeiculo" NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER,
    "cor" TEXT,
    "combustivel" TEXT,
    "km" INTEGER,
    "chassi" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "imeiGps" TEXT,
    "dispositivoTraccarId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tecnicos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoVeiculo" "TipoVeiculo",
    "tempoEstMin" INTEGER,
    "precoMaoObra" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pecas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "unidade" "UnidadeMedida" NOT NULL DEFAULT 'UN',
    "qtdEstoque" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "qtdMinima" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoPadrao" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_estoque" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "custo" DECIMAL(10,2),
    "ordemId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "servicoId" TEXT,
    "tecnicoId" TEXT,
    "usuarioId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracao" INTEGER NOT NULL DEFAULT 60,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "usuarioId" TEXT,
    "agendamentoId" TEXT,
    "status" "StatusOrdem" NOT NULL DEFAULT 'ABERTA',
    "kmEntrada" INTEGER,
    "kmSaida" INTEGER,
    "relatoCliente" TEXT,
    "laudoTecnico" TEXT,
    "observacoes" TEXT,
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevista" TIMESTAMP(3),
    "dataEntrega" TIMESTAMP(3),
    "totalMaoObra" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPecas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_ordem" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorUnit" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "itens_ordem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_peca_ordem" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "valorUnit" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_peca_ordem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_ordens" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "status" "StatusOrdem" NOT NULL,
    "observacao" TEXT,
    "usuarioNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_ordens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos_financeiros" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ordemId" TEXT,
    "tipo" "TipoLancamento" NOT NULL,
    "categoria" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lancamentos_financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_fidelidade" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "nivel" "NivelFidelidade" NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_fidelidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes_pontos" (
    "id" TEXT NOT NULL,
    "pontosId" TEXT NOT NULL,
    "tipo" "TipoTransacaoPontos" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "descricao" TEXT,
    "ordemId" TEXT,
    "expiracao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacoes_pontos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_tenantId_email_key" ON "usuarios"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_tenantId_cpf_key" ON "clientes"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_tenantId_placa_key" ON "veiculos"("tenantId", "placa");

-- CreateIndex
CREATE UNIQUE INDEX "tecnicos_usuarioId_key" ON "tecnicos"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "pecas_tenantId_codigo_key" ON "pecas"("tenantId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_agendamentoId_key" ON "ordens_servico"("agendamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_tenantId_numero_key" ON "ordens_servico"("tenantId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "pontos_fidelidade_clienteId_key" ON "pontos_fidelidade"("clienteId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tecnicos" ADD CONSTRAINT "tecnicos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tecnicos" ADD CONSTRAINT "tecnicos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pecas" ADD CONSTRAINT "pecas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem" ADD CONSTRAINT "itens_ordem_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem" ADD CONSTRAINT "itens_ordem_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_peca_ordem" ADD CONSTRAINT "itens_peca_ordem_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_peca_ordem" ADD CONSTRAINT "itens_peca_ordem_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_ordens" ADD CONSTRAINT "historico_ordens_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos_fidelidade" ADD CONSTRAINT "pontos_fidelidade_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_pontos" ADD CONSTRAINT "transacoes_pontos_pontosId_fkey" FOREIGN KEY ("pontosId") REFERENCES "pontos_fidelidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
