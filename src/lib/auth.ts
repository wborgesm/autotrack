import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { NivelAcesso } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Autotrack",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        console.log('🔐 Tentativa de login:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Email ou senha em falta');
          return null;
        }

        // Buscar o tenant padrão associado ao email (se existir)
        // Como a tabela tem unique(tenantId, email), podemos ter vários tenants com o mesmo email.
        // Para simplificar, procuramos em todos os tenants e retornamos o primeiro ativo.
        const user = await prisma.usuario.findFirst({
          where: {
            email: credentials.email,
            ativo: true,
          },
          include: { tenant: true },
        });

        console.log('👤 Utilizador encontrado?', user ? user.email : 'não');
        if (!user) {
          console.log('❌ Utilizador não encontrado ou inativo');
          return null;
        }

        console.log('🔑 Comparando senha...');
        const passwordMatch = await bcrypt.compare(credentials.password, user.senha);
        console.log('🔑 Senha válida?', passwordMatch);

        if (!passwordMatch) {
          console.log('❌ Senha incorreta');
          return null;
        }

        console.log('✅ Login bem-sucedido para:', user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          tenantId: user.tenantId,
          nivel: user.nivel,
          avatar: user.avatar,
          plano: user.tenant.plano,
          logo: user.tenant.logo || null,
          tenantAtivo: user.tenant.ativo,
          addons: {
            gps: user.tenant.addonGps,
            pontos: user.tenant.addonPontos,
            whatsapp: user.tenant.addonWhatsapp,
            portalCliente: user.tenant.addonPortalCliente,
          },
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.tenantId = user.tenantId;
        token.nivel = user.nivel as NivelAcesso;
        token.avatar = user.avatar;
        token.plano = user.plano;
        token.tenantAtivo = user.tenantAtivo;
        token.addons = user.addons;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.tenantId = token.tenantId as string;
        session.user.nivel = token.nivel as NivelAcesso;
        session.user.avatar = token.avatar as string | null;
        session.user.plano = token.plano as string;
        session.user.logo = token.logo as string | null;
        session.user.tenantAtivo = token.tenantAtivo as boolean;
        session.user.addons = token.addons as {
          gps: boolean;
          pontos: boolean;
          whatsapp: boolean;
          portalCliente: boolean;
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
