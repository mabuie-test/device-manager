import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { initializeDatabase } from './database/connection.js';
import { registerRoutes } from './routes/index.js';
import { createChatGateway } from './modules/chat/chatGateway.js';
import { bootstrapMpesaIntegration } from './utils/mpesa.js';

try {
  await initializeDatabase();
  console.log('Ligação à base de dados estabelecida com sucesso.');
} catch (error) {
  console.error('Falha ao ligar à base de dados:', error);
  process.exit(1);
}

await bootstrapMpesaIntegration();

const app = express();

app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

registerRoutes(app);

const server = http.createServer(app);
createChatGateway(server);

server.listen(env.port, () => {
  console.log(`BetPulse API em execução na porta ${env.port}`);
});
