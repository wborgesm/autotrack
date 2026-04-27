/**
 * Cliente da API Moloni (Faturação Certificada - Portugal)
 * Suporte multi-tenant: cada empresa tem as suas próprias credenciais
 */

import { prisma } from "@/lib/prisma";

const BASE_URL = "https://api.moloni.pt/v1";

interface TokenCache {
  [tenantId: string]: {
    access_token: string;
    expires_at: number;
  };
}

const tokenCache: TokenCache = {};

async function getTenantConfig(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { moloniDevId: true, moloniSecret: true, moloniEmail: true, moloniPass: true, moloniCompanyId: true },
  });

  if (!tenant?.moloniDevId || !tenant?.moloniSecret || !tenant?.moloniEmail || !tenant?.moloniPass || !tenant?.moloniCompanyId) {
    return null;
  }

  return {
    developerId: tenant.moloniDevId,
    clientSecret: tenant.moloniSecret,
    username: tenant.moloniEmail,
    password: tenant.moloniPass,
    companyId: tenant.moloniCompanyId,
  };
}

export async function isMoloniConfiguredForTenant(tenantId: string): Promise<boolean> {
  const config = await getTenantConfig(tenantId);
  return config !== null;
}

async function getAccessToken(tenantId: string): Promise<string> {
  const cache = tokenCache[tenantId];
  if (cache && Date.now() < cache.expires_at - 300000) {
    return cache.access_token;
  }

  const config = await getTenantConfig(tenantId);
  if (!config) throw new Error("Moloni não configurado para esta empresa");

  const params = new URLSearchParams({
    grant_type: "password",
    client_id: config.developerId,
    client_secret: config.clientSecret,
    username: config.username,
    password: config.password,
  });

  const res = await fetch(`${BASE_URL}/grant/?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Falha na autenticação Moloni: ${err.error_description || err.error || res.statusText}`);
  }

  const data = await res.json();
  tokenCache[tenantId] = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return data.access_token;
}

async function apiCall(tenantId: string, endpoint: string, data: Record<string, any> = {}) {
  const config = await getTenantConfig(tenantId);
  if (!config) throw new Error("Moloni não configurado para esta empresa");
  const token = await getAccessToken(tenantId);
  if (!data.company_id) data.company_id = config.companyId;

  const url = `${BASE_URL}/${endpoint}/?access_token=${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(data).toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro Moloni (${endpoint}): ${err.error_description || err.error || res.statusText}`);
  }
  return res.json();
}

export async function findOrCreateCustomer(tenantId: string, nome: string, nif?: string, email?: string, telefone?: string, morada?: string): Promise<number> {
  if (nif) {
    const searchResult = await apiCall(tenantId, "customers/getByVat", { vat: nif });
    if (Array.isArray(searchResult) && searchResult.length > 0) return searchResult[0].customer_id;
  }
  const insertResult = await apiCall(tenantId, "customers/insert", { name: nome, vat: nif || "", email: email || "", phone: telefone || "", address: morada || "", country_id: 1, salesman_id: "", payment_day: "", maturity_date_id: "" });
  return insertResult.customer_id;
}

export async function createSimplifiedInvoice(
  tenantId: string, customerId: number, products: any[], options: { ourReference?: string; notes?: string; status?: number; date?: string } = {}
): Promise<{ document_id: number; number: string; url: string }> {
  const result = await apiCall(tenantId, "simplifiedInvoices/insert", {
    customer_id: customerId,
    date: options.date || new Date().toISOString().slice(0, 10),
    our_reference: options.ourReference || "",
    notes: options.notes || "",
    status: options.status ?? 1,
    products: JSON.stringify(products),
  });
  return { document_id: result.document_id, number: result.number, url: result.url || "" };
}
