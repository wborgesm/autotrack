-- CreateTable
CREATE TABLE "pending_tenants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "addons" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "gateway" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "checkoutUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_tenants_pkey" PRIMARY KEY ("id")
);
