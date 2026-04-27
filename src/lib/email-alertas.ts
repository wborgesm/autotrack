import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function enviarEmailCritico(alerta: any) {
  const emailExterno = process.env.EMAIL_ALERTAS_EXTERNO;
  if (!emailExterno) return;

  await transporter.sendMail({
    to: emailExterno,
    subject: `[AUTOTRACK ALERTA ${alerta.gravidade}] ${alerta.tipo}`,
    html: `<h1>${alerta.tipo}</h1><p>Gravidade: ${alerta.gravidade}</p><p>${alerta.descricao}</p><p>Tenant: ${alerta.tenantId}</p><p>Data: ${alerta.createdAt}</p>`,
  });
}
