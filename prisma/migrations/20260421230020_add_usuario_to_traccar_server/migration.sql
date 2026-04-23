-- CreateTable
CREATE TABLE "traccar_servers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 443,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "traccar_servers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "traccar_servers_tenantId_usuarioId_nome_key" ON "traccar_servers"("tenantId", "usuarioId", "nome");

-- AddForeignKey
ALTER TABLE "traccar_servers" ADD CONSTRAINT "traccar_servers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traccar_servers" ADD CONSTRAINT "traccar_servers_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
