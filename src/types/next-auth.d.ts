import { NivelAcesso } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    tenantId: string;
    nivel: NivelAcesso;
    avatar?: string | null;
    plano: string;
    tenantAtivo: boolean;
    addons: {
      gps: boolean;
      pontos: boolean;
      whatsapp: boolean;
      portalCliente: boolean;
    };
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      nivel: NivelAcesso;
      avatar?: string | null;
      plano: string;
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
    tenantAtivo: boolean;
    addons: {
      gps: boolean;
      pontos: boolean;
      whatsapp: boolean;
      portalCliente: boolean;
    };
  }
}
