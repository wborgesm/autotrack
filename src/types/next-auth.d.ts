import { NivelAcesso } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      nivel: NivelAcesso;
      avatar?: string | null;
      plano: string;
      logo?: string | null;
      tenantAtivo: boolean;
      addons: {
        gps: boolean;
        pontos: boolean;
        whatsapp: boolean;
        portalCliente: boolean;
      };
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    nivel: NivelAcesso;
    avatar?: string | null;
    plano: string;
    logo?: string | null;
    tenantAtivo: boolean;
    addons: {
      gps: boolean;
      pontos: boolean;
      whatsapp: boolean;
      portalCliente: boolean;
    };
  }
}

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    nivel: string;
    avatar?: string | null;
    plano: string;
    logo?: string | null;
    tenantAtivo: boolean;
    addons: {
      gps: boolean;
      pontos: boolean;
      whatsapp: boolean;
      portalCliente: boolean;
    };
  }
}
