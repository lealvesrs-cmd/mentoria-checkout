# Checkout — Mentoria Tráfego & Liberdade
## Deploy na Vercel (passo a passo)

---

### Estrutura do projeto

```
projeto/
├── api/
│   ├── checkout.js      ← backend seguro (chama Asaas, nunca expõe a chave)
│   └── webhook.js       ← recebe notificações de pagamento confirmado
├── public/
│   ├── index.html       ← formulário de checkout (layout original)
│   └── obrigado.html    ← página pós-pagamento
├── vercel.json          ← configuração de rotas
├── package.json
└── README.md
```

---

### 1. Criar conta na Vercel

Acesse https://vercel.com e crie uma conta gratuita (pode entrar com GitHub).

---

### 2. Subir o projeto

**Opção A — via GitHub (recomendado):**
1. Crie um repositório no GitHub e suba esta pasta
2. Na Vercel, clique em "Add New Project" → importe o repositório
3. Clique em "Deploy" — pronto

**Opção B — via CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

### 3. Configurar a variável de ambiente (OBRIGATÓRIO)

Sua chave de API do Asaas **nunca deve ficar no código**.
Ela fica guardada como variável de ambiente na Vercel:

1. No painel da Vercel → seu projeto → **Settings → Environment Variables**
2. Adicione:
   - **Name:** `ASAAS_API_KEY`
   - **Value:** sua chave (ex: `$aact_prod_...`)
   - **Environment:** Production, Preview, Development ✓ todos
3. Clique em **Save**
4. Faça um novo deploy para a variável entrar em vigor

---

### 4. Configurar Webhook no Asaas (para PIX e boleto)

Para confirmar automaticamente pagamentos de PIX e boleto:

1. No painel Asaas → **Configurações → Integrações → Webhook**
2. Clique em **Adicionar URL**
3. URL: `https://SEU-PROJETO.vercel.app/api/webhook`
4. Eventos: marque `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`
5. Salve

---

### 5. Personalizar

Edite o topo do `api/checkout.js` para alterar:
- Valor do produto (`value: 997.00`)
- Nome do produto (`description`)
- Número máximo de parcelas

Edite o topo do `public/index.html` para alterar:
- `REDIRECT_URL` — página para redirecionar após pagamento confirmado
- `MAX_INSTALLMENTS` — parcelas máximas
- `PRICE` — valor para cálculo do parcelamento

---

### Segurança

| Versão antiga | Esta versão |
|---|---|
| Chave Asaas exposta no HTML | Chave guardada como variável de ambiente |
| Qualquer pessoa via "Ver código" tinha acesso | Chave nunca chega ao navegador |
| Chamadas diretas do browser para Asaas | Chamadas passam pelo servidor Vercel |

---

### Dúvidas?

- Vercel Docs: https://vercel.com/docs
- Asaas API: https://docs.asaas.com
