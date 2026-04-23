const { PrismaClient, Plano } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 A criar/atualizar tenant...');
    const tenant = await prisma.tenant.upsert({
      where: { id: 'demo-tenant' },
      update: {},
      create: {
        id: 'demo-tenant',
        nome: 'Autotrack Demo',
        plano: Plano.STARTER,
        ativo: true,
        addonGps: true,
        addonPontos: true,
      },
    });
    console.log('✅ Tenant:', tenant.nome);

    console.log('🔍 A criar/atualizar utilizador SUPER_ADMIN...');
    const hash = await bcrypt.hash('123456', 10);
    const user = await prisma.usuario.upsert({
      where: { email: 'wborges.m@icloud.com' },
      update: { senha: hash, nivel: 'SUPER_ADMIN', ativo: true },
      create: {
        tenantId: tenant.id,
        nome: 'W. Borges',
        email: 'wborges.m@icloud.com',
        senha: hash,
        nivel: 'SUPER_ADMIN',
        ativo: true,
      },
    });
    console.log('✅ Utilizador criado:', user.email);
    console.log('   Nível:', user.nivel);
    console.log('   Senha temporária: 123456');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
})();
