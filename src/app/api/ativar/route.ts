import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });

    const pending = await prisma.pendingTenant.findFirst({
      where: { email, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        nome: pending.nome,
        email: pending.email,
        plano: pending.plano as any,
        addonGps: pending.addons.includes('gps'),
        addonPontos: pending.addons.includes('fidelidade'),
        addonWhatsapp: pending.addons.includes('whatsapp'),
        addonPortalCliente: false,
        ativo: true,
      },
    });

    // Criar utilizador ADMIN
    const senha = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(senha, 10);
    await prisma.usuario.create({
      data: {
        tenantId: tenant.id,
        nome: 'Administrador',
        email: pending.email,
        senha: hash,
        nivel: 'ADMIN',
        ativo: true,
      },
    });

    // Marcar como ativado
    await prisma.pendingTenant.update({
      where: { id: pending.id },
      data: { status: 'ACTIVATED' },
    });

    // Enviar email (SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Autotrack" <no-reply@autotrack.pt>',
      to: pending.email,
      subject: 'Bem-vindo ao Autotrack!',
      text: `Olá, a sua conta está pronta!\n\nURL: https://sistema.autotrack.pt\nEmail: ${pending.email}\nSenha: ${senha}\n\nRecomendamos alterar a senha após o primeiro acesso.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
