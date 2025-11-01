# Guia de Deploy no Render

Este documento descreve o processo recomendado para publicar a API (server) e o frontend (web) da plataforma FluxoBet na Render. As instruções assumem que o código já está no GitHub e que você possui uma conta na Render com permissão para criar serviços.

## Pré-requisitos

- Banco de dados MongoDB Atlas previamente configurado e acessível pela Render.
- Credenciais do ecossistema M-Pesa (consumer key/secret, shortcode, passkey, iniciador, etc.).
- Seeds iniciais (email e senha) para o utilizador `admin` que será criado na primeira execução.
- Repositório GitHub com acesso de leitura pela Render.

## Organização recomendada via `render.yaml`

O repositório inclui um ficheiro [`render.yaml`](./render.yaml) com a definição de dois serviços:

1. **fluxobet-server**: serviço Node que expõe a API REST, o gateway de chat (Socket.IO) e os webhooks do M-Pesa.
2. **fluxobet-web**: site estático construído com Vite/React que consome a API.

Ao importar o repositório na Render escolha a opção **Blueprint** e a plataforma irá provisionar os serviços automaticamente. Antes de confirmar, edite as variáveis de ambiente marcadas com `sync: false` para inserir os valores secretos.

Caso prefira configurar manualmente, siga os passos abaixo para cada componente.

## Deploy do Server (API)

1. **Criação do serviço**
   - Tipo: `Web Service`
   - Ambiente: `Node`
   - Branch: a que contém o código estável (por exemplo, `main`).
   - Diretório raiz: `server`
2. **Build & Start**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. **Runtime**
   - Defina a variável `NODE_VERSION=20` para alinhar com o TypeScript compilado para ES2020.
   - Não defina manualmente a variável `PORT`; a Render fornece o valor adequado durante a execução e a API já utiliza `process.env.PORT`.
4. **Variáveis de ambiente obrigatórias**
   - `CORS_ORIGINS`: lista separada por vírgulas com os domínios autorizados a consumir a API (ex.: `https://app.suaempresa.com,https://fluxobet-web.onrender.com`).
   - `JWT_SECRET`: chave segura para assinar tokens.
   - `MONGO_URI`: string de ligação do MongoDB Atlas (incluindo usuário e senha).
   - `MONGO_DB_NAME`: nome da base (padrão `fluxobet`).
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD`: credenciais iniciais do administrador.
   - Variáveis M-Pesa: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_INITIATOR`, `MPESA_CALLBACK_BASE_URL`, `MPESA_ENVIRONMENT` (`sandbox` ou `production`) e, se necessário, `MPESA_SECURITY_CREDENTIAL`, `MPESA_INITIATOR_PASSWORD`, `MPESA_CERTIFICATE_PATH`, `MPESA_COUNTRY_CODE`.
5. **Conectividade**
   - Adicione a lista de IPs de saída da Render ao *Access List* do Atlas.
   - Para callbacks M-Pesa, configure as URLs apontando para `https://<domínio-do-server>/api/finance/mpesa/...`.
6. **Verificação**
   - Após o deploy, abra `https://<domínio-do-server>/health` e confirme que o JSON `{ "status": "ok" }` é devolvido.
   - Verifique os logs para confirmar ligação ao MongoDB e bootstrap das credenciais M-Pesa.

## Deploy do Web (Frontend)

1. **Criação do serviço**
   - Tipo: `Static Site`
   - Diretório raiz: `web`
2. **Build & Publish**
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
3. **Variáveis de ambiente de build**
   - `VITE_API_BASE_URL`: URL pública da API (ex.: `https://fluxobet-server.onrender.com/api`).
   - `VITE_SOCKET_URL`: URL base do Socket.IO (normalmente `https://fluxobet-server.onrender.com`).
   - `VITE_SOCKET_PATH`: caminho do Socket.IO (padrão `/socket.io`).
4. **Testes**
   - Após publicar, aceda ao domínio fornecido pela Render e valide o login, registo e chat.
   - Abra a consola do navegador para garantir que as requisições são direcionadas para o domínio correto da API.

## Pós-deploy

- Configure o domínio customizado (se aplicável) para ambos os serviços.
- Ative monitorização e alertas na Render (Health Checks, Email Alerts).
- Valide os fluxos M-Pesa (C2B, B2C, STK) através dos endpoints de callback expostos na API.
- Atualize os registos DNS e políticas de privacidade/termos conforme a legislação local de apostas.

Seguindo os passos acima, a aplicação estará preparada para funcionar de forma escalável e segura na Render.
