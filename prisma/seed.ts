import { PrismaClient, Plano, NivelAcesso, TipoVeiculo } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      nome: 'Autotrack Demo',
      cnpj: '12.345.678/0001-99',
      telefone: '(11) 99999-9999',
      email: 'contato@autotrack.com',
      plano: Plano.STARTER,
      addonGps: true,
      addonPontos: true,
    },
  })

  const senhaHash = await bcrypt.hash('123456', 10)

  const admin = await prisma.usuario.upsert({
    where: { id: 'admin-demo' },
    update: {},
    create: {
      id: 'admin-demo',
      tenantId: tenant.id,
      nome: 'Administrador',
      email: 'admin@demo.com',
      senha: senhaHash,
      nivel: NivelAcesso.ADMIN,
      avatar: null,
    },
  })

  const tecnico = await prisma.usuario.upsert({
    where: { id: 'tecnico-demo' },
    update: {},
    create: {
      id: 'tecnico-demo',
      tenantId: tenant.id,
      nome: 'João Técnico',
      email: 'tecnico@demo.com',
      senha: senhaHash,
      nivel: NivelAcesso.TECNICO,
    },
  })

  const recepcao = await prisma.usuario.upsert({
    where: { id: 'recepcao-demo' },
    update: {},
    create: {
      id: 'recepcao-demo',
      tenantId: tenant.id,
      nome: 'Maria Recepção',
      email: 'recepcao@demo.com',
      senha: senhaHash,
      nivel: NivelAcesso.RECEPCIONISTA,
    },
  })

  const clienteUser = await prisma.usuario.upsert({
    where: { id: 'cliente-demo' },
    update: {},
    create: {
      id: 'cliente-demo',
      tenantId: tenant.id,
      nome: 'Carlos Cliente',
      email: 'cliente@demo.com',
      senha: senhaHash,
      nivel: NivelAcesso.CLIENTE,
    },
  })

  const cliente = await prisma.cliente.upsert({
    where: { id: 'cliente-1' },
    update: {},
    create: {
      id: 'cliente-1',
      tenantId: tenant.id,
      nome: 'Carlos Silva',
      cpf: '123.456.789-00',
      telefone: '(11) 98888-7777',
      email: 'carlos@email.com',
      endereco: 'Rua das Oficinas, 123',
    },
  })

  await prisma.veiculo.upsert({
    where: { id: 'veiculo-1' },
    update: {},
    create: {
      id: 'veiculo-1',
      tenantId: tenant.id,
      clienteId: cliente.id,
      tipo: TipoVeiculo.CARRO,
      placa: 'ABC1D23',
      marca: 'Fiat',
      modelo: 'Palio',
      ano: 2019,
      cor: 'Prata',
      km: 45000,
    },
  })

  await prisma.tecnico.upsert({
    where: { id: 'tecnico-1' },
    update: {},
    create: {
      id: 'tecnico-1',
      tenantId: tenant.id,
      usuarioId: tecnico.id,
      nome: tecnico.nome,
      especialidade: 'Mecânica geral',
      telefone: '(11) 97777-6666',
    },
  })

  await prisma.servico.createMany({
    skipDuplicates: true,
    data: [
      {
        tenantId: tenant.id,
        nome: 'Troca de óleo',
        descricao: 'Troca de óleo e filtro',
        precoMaoObra: 80.0,
        tempoEstMin: 30,
      },
      {
        tenantId: tenant.id,
        nome: 'Alinhamento e balanceamento',
        precoMaoObra: 120.0,
        tempoEstMin: 60,
      },
      {
        tenantId: tenant.id,
        nome: 'Revisão completa',
        precoMaoObra: 350.0,
        tempoEstMin: 180,
      },
    ],
  })

  console.log('✅ Seed concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
