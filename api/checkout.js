// api/checkout.js
// Vercel Serverless Function — recebe dados do formulário, cria cliente e cobrança no Asaas
// A chave de API fica SOMENTE aqui no servidor, nunca exposta no frontend

const ASAAS_BASE_URL = 'https://api.asaas.com/v3';

async function asaasPost(endpoint, body) {
  const res = await fetch(ASAAS_BASE_URL + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY   // variável de ambiente segura
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { name, email, cpfCnpj, phone, cep, billingType, creditCard, creditCardHolderInfo, installmentCount } = req.body;

  // Validação básica
  if (!name || !email || !cpfCnpj || !billingType) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    // 1. Cria ou recupera cliente no Asaas
    const customer = await asaasPost('/customers', { name, email, cpfCnpj, mobilePhone: phone, postalCode: cep });
    if (customer.errors) {
      return res.status(422).json({ error: customer.errors[0]?.description || 'Erro ao criar cliente' });
    }

    // 2. Monta payload da cobrança
    const chargePayload = {
      customer: customer.id,
      billingType,
      value: 997.00,
      dueDate: new Date().toISOString().split('T')[0],
      description: 'Mentoria Individualizada — Tráfego & Liberdade'
    };

    // Dados extras para cartão de crédito
    if (billingType === 'CREDIT_CARD') {
      chargePayload.creditCard = creditCard;
      chargePayload.creditCardHolderInfo = { ...creditCardHolderInfo, phone, mobilePhone: phone, postalCode: cep };
      if (installmentCount && installmentCount > 1) {
        chargePayload.installmentCount = installmentCount;
        chargePayload.installmentValue = parseFloat((997.00 / installmentCount).toFixed(2));
      }
    }

    // 3. Cria cobrança
    const charge = await asaasPost('/payments', chargePayload);

    if (charge.errors) {
      return res.status(422).json({ error: charge.errors[0]?.description || 'Pagamento recusado' });
    }

    // 4. Retorna resposta de acordo com o método de pagamento
    if (billingType === 'CREDIT_CARD') {
      if (charge.status === 'CONFIRMED' || charge.status === 'RECEIVED') {
        return res.status(200).json({ success: true, status: charge.status });
      } else {
        return res.status(422).json({ error: 'Cartão recusado. Verifique os dados e tente novamente.' });
      }
    }

    if (billingType === 'PIX') {
      // Busca QR Code do PIX
      const pixRes = await fetch(`${ASAAS_BASE_URL}/payments/${charge.id}/pixQrCode`, {
        headers: { 'access_token': process.env.ASAAS_API_KEY }
      });
      const pix = await pixRes.json();
      return res.status(200).json({
        success: true,
        pixQrCode: {
          encodedImage: pix.encodedImage,
          payload: pix.payload
        }
      });
    }

    // Boleto
    if (billingType === 'BOLETO') {
      return res.status(200).json({
        success: true,
        bankSlipUrl: charge.bankSlipUrl,
        invoiceUrl: charge.invoiceUrl
      });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Erro no checkout:', err);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
