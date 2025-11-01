# FluxoBet – Plataforma de Apostas Provably Fair

Este repositório contém uma solução completa para uma casa de apostas moderna construída em Node.js e React. A stack foi
organizada para oferecer transparência (provably fair), integração financeira com MPesa Moçambique, ferramentas de gestão
administrativa e um front-end estilizado que transmite confiança.

## Estrutura do projeto

```
.
├── server/            # API Express + Socket.IO + MongoDB (Mongoose)
│   ├── src/
│   │   ├── config/    # Gestão de variáveis de ambiente
│   │   ├── controllers
│   │   ├── database/  # Inicialização e seed da base de dados
│   │   ├── middlewares
│   │   ├── modules/   # Módulo de chat em tempo real
│   │   ├── routes
│   │   ├── services   # Lógica de negócio (jogos, finanças, futebol, utilizadores)
│   │   └── utils      # Provably fair, JWT, MPesa helpers
│   ├── package.json
│   └── .env.example
├── web/               # Interface React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/     # Ecrãs para jogadores e administradores
│   │   ├── components
│   │   ├── context    # Gestão de autenticação
│   │   └── services   # Cliente Axios partilhado
│   └── package.json
├── .gitignore
└── README.md
```

## Principais funcionalidades

- **Jogos provably fair (probabilidade 1/4)**: cada aposta gera seeds, nonce e HMAC para verificação independente.
- **Integração MPesa completa (STK + B2C)**: autenticação OAuth, registo automático de URLs e fluxos STK Push/B2C com
  monitorização administrativa.
- **Gestão financeira**: registo de depósitos/levantamentos, aprovação administrativa e métricas agregadas.
- **Mini jogos instantâneos**: catálogo com 11 jogos 1/4 provably fair disponíveis em modo rápido (quick play) ou completo.
- **Painel administrativo**: controlo de utilizadores, redefinição de senhas, ajuste de saldos e gestão de partidas de futebol.
- **Chat em tempo real**: Socket.IO com histórico persistente em MongoDB.
- **Front-end responsivo**: páginas modernas com Tailwind CSS, temas escuros e chamadas à ação claras.

## Requisitos

- Node.js 18+
- npm 9+

## Como executar localmente

1. **API**
   ```bash
   cd server
   cp .env.example .env
   npm install
   npm start
   ```

   O comando `npm start` compila automaticamente o código TypeScript antes de lançar o servidor, garantindo que o
   diretório `dist/` exista mesmo em ambientes de deploy (ex.: Render). A API ficará disponível em
   `http://localhost:4000`. Configure as variáveis `MONGO_URI` e `MONGO_DB_NAME` para apontar
   para a instância do MongoDB Atlas (ou local). O script de inicialização cria um utilizador administrador padrão
   (`admin@fluxobet.co.mz / Admin@12345`) e popula automaticamente 11 jogos com probabilidade 1/4 e payout otimizado
   para lucro líquido.

2. **Front-end**
   ```bash
   cd web
   npm install
   npm run dev
   ```

   A interface ficará acessível em `http://localhost:5173`, proxyando chamadas para a API (`/api`).

## Notas sobre MPesa

- Configure as credenciais reais nos campos `MPESA_*` do `.env`. Pode optar por definir o `MPESA_SECURITY_CREDENTIAL` já
  encriptado ou fornecer `MPESA_INITIATOR_PASSWORD` + `MPESA_CERTIFICATE_PATH` para que a credencial seja gerada
  automaticamente seguindo o exemplo oficial (`mpesa-api-node-main`).
- O módulo `server/src/utils/mpesa.ts` trata da geração de tokens, registo de URLs C2B, pedidos STK Push e pagamentos B2C
  usando a mesma abordagem do exemplo `mpesa-api-node-main`.
- Atualize `MPESA_CALLBACK_BASE_URL` para apontar para o domínio público da API. As rotas
  `/api/finance/mpesa/stk-callback`, `/api/finance/mpesa/b2c-result` e `/api/finance/mpesa/b2c-timeout` receberão as
  notificações oficiais.
- Depósitos são iniciados em `/api/finance/deposit` e confirmados pelo callback STK. Levantamentos exigem aprovação em
  `/api/finance/admin/withdrawals/:transactionId/approve`, que desencadeia o pagamento B2C automático.
- Os registos ficam guardados na coleção `transactions`, incluindo metadados MPesa completos para auditoria.

## Extensibilidade

- **Outros provedores de jogos**: adicione novos módulos em `server/src/services` e registe-os na coleção `game_definitions`.
- **Streaming e escuta ambiente**: o módulo de chat já utiliza Socket.IO; estender para WebRTC/RTMP implica apenas adicionar
  novos namespaces/socket events.
- **Compliance**: o painel oferece métricas iniciais, mas novas exportações podem ser adicionadas com facilidade na camada de
  serviços.

## Segurança

- Hash de senhas com `bcryptjs`.
- JWT com expiração de 12h.
- CORS configurável via `CORS_ORIGINS`.
- Helmet + logs HTTP (`morgan`).

Qualquer melhoria adicional pode ser feita através de pull requests, seguindo a organização modular descrita acima.
