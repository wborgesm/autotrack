import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const { nome, email, plano, periodo = 'mensal', addons = [] } = await req.json();

    if (!nome || !email || !plano) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const precosPlanos: Record<string, number> = {
      STARTER: 19.90,
      PROFISSIONAL: 34.90,
      BUSINESS: 59.90,
    };
    const precosAddons: Record<string, number> = {
      gps: 14.90,
      fidelidade: 9.90,
      ia: 12.90,
      whatsapp: 0,
    };

    let basePrice = precosPlanos[plano] || 0;
    for (const addon of addons) {
      basePrice += precosAddons[addon] || 0;
    }

    // Cálculo do total: mensal mantém o preço base; anual aplica desconto e multiplica por 12
    let total: number;
    if (periodo === 'anual') {
      const mensalComDesconto = basePrice * 0.85; // 15% de desconto
      total = mensalComDesconto * 12;
    } else {
      total = basePrice;
    }

    if (total <= 0) {
      return NextResponse.json({ error: 'Valor total inválido' }, { status: 400 });
    }

    // Criar registo pendente
    const pending = await prisma.pendingTenant.create({
      data: {
        email,
        nome,
        plano,
        addons: addons.join(','),
        total,
        gateway: (periodo === 'mensal' && stripe) ? 'stripe' : 'sumup',
        status: 'PENDING',
      },
    });

    // Se for pagamento mensal e o Stripe estiver configurado, usar Stripe (assinatura)
    if (periodo === 'mensal' && stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: `Plano ${plano} - Autotrack` },
              unit_amount: Math.round(total * 100), // cêntimos
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'https://autotrack.pt/sucesso',
        cancel_url: 'https://autotrack.pt/cancelar',
        customer_email: email,
        metadata: { pendingId: pending.id },
      });

      await prisma.pendingTenant.update({
        where: { id: pending.id },
        data: { checkoutUrl: session.url, gateway: 'stripe' },
      });

      return NextResponse.json({ checkoutUrl: session.url });
    }

    // Caso contrário (anual ou Stripe indisponível), usar SumUp
    const apiKey = process.env.SUMUP_API_KEY!;
    const merchantCode = process.env.SUMUP_MERCHANT_CODE || "MX4ZF62W";

    const sumupPayload: any = {
      amount: total,
      checkout_reference: `autotrack-${Date.now()}`,
      currency: 'EUR',
      merchant_code: merchantCode,
      description: `Plano ${plano} - Autotrack (${periodo})`,
      return_url: 'https://autotrack.pt/sucesso',
      cancel_url: 'https://autotrack.pt/cancelar',
    };

    const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sumupPayload),
    });

    if (!sumupResponse.ok) {
      const errorText = await sumupResponse.text();
      console.error('SumUp checkout error:', errorText);
      throw new Error(`SumUp checkout error: ${errorText}`);
    }

    const sumupData = await sumupResponse.json();

    await prisma.pendingTenant.update({
      where: { id: pending.id },
      data: { checkoutUrl: sumupData.id, gateway: 'sumup' },
    });

    return NextResponse.json({ checkoutId: sumupData.id });
  } catch (error: any) {
    console.error('Erro no checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
