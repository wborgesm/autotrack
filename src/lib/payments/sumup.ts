export async function createSumUpCheckout(
  amountEUR: number,
  description: string,
  merchantCode: string,
  apiKey: string,
  mode: 'sandbox' | 'live' = 'sandbox'
): Promise<string> {
  const payload: any = {
    checkout_reference: `autotrack-${Date.now()}`,
    amount: amountEUR,
    currency: 'EUR',
    merchant_code: merchantCode,
    description: description,
    return_url: 'https://autotrack.pt/sucesso',
    cancel_url: 'https://autotrack.pt/cancelar',
  };

  const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('SumUp checkout error response:', errorText);
    throw new Error(`SumUp checkout error: ${errorText}`);
  }

  const data = await response.json();
  return data.checkout_url;
}
