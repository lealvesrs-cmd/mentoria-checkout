// api/webhook.js
// Recebe notificações do Asaas quando o pagamento é confirmado (PIX, boleto, etc.)
// Configure no painel Asaas: Configurações → Integrações → Webhook
// URL: https://SEU-PROJETO.vercel.app/api/webhook

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const event = req.body;

  console.log('Webhook recebido:', JSON.stringify(event, null, 2));

  // Eventos de pagamento confirmado
  const eventosConfirmados = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];

  if (eventosConfirmados.includes(event.event)) {
    const payment = event.payment;

    console.log(`✅ Pagamento confirmado!`);
    console.log(`   ID: ${payment.id}`);
    console.log(`   Cliente: ${payment.customer}`);
    console.log(`   Valor: R$ ${payment.value}`);
    console.log(`   Método: ${payment.billingType}`);

    // -----------------------------------------------------------------------
    // AQUI você adiciona as ações pós-pagamento, por exemplo:
    //
    // 1. Enviar e-mail de boas-vindas (com Resend, SendGrid, etc.)
    //    await sendWelcomeEmail(payment.customer);
    //
    // 2. Salvar no banco de dados
    //    await db.insert({ customerId: payment.customer, paidAt: new Date() });
    //
    // 3. Liberar acesso ao produto
    //    await grantAccess(payment.customer);
    // -----------------------------------------------------------------------
  }

  // Sempre responder 200 para o Asaas não retentar
  return res.status(200).json({ received: true });
}
