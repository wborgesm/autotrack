const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    // Remover utilizador existente (se houver)
    await prisma.usuario.deleteMany({ where: { email: 'wborges.m@icloud.com' } });

    // Criar novo utilizador com senha bcrypt (10 rounds)
    const hash = await bcrypt.hash('123456', 10);
    const user = await prisma.usuario.create({
      data: {
        tenantId: 'demo-tenant',
        nome: 'W. Borges',
        email: 'wborges.m@icloud.com',
        senha: hash,
        nivel: 'SUPER_ADMIN',
        ativo: true,
      },
    });
    console.log('✅ Utilizador criado:', user.email);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
})();
