import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { hashPassword } from '../utils/password.js';
import { GameDefinitionModel, UserModel } from './models/index.js';

const gameSeeds = [
  {
    key: 'lucky-wheel',
    name: 'Lucky Wheel',
    description: 'Gire a roda com quatro segmentos e escolha o símbolo vencedor.',
    category: 'Arcade',
    payoutMultiplier: 3.85,
    icon: '🎡',
  },
  {
    key: 'crystal-colors',
    name: 'Crystal Colors',
    description: 'Selecione uma das quatro cores cintilantes para revelar o cristal premiado.',
    category: 'Instant Win',
    payoutMultiplier: 3.9,
    icon: '💎',
  },
  {
    key: 'dice-duel',
    name: 'Dice Duel',
    description: 'Duelo de dados digitais onde apenas uma face especial vence.',
    category: 'Dados',
    payoutMultiplier: 3.8,
    icon: '🎲',
  },
  {
    key: 'nebula-spin',
    name: 'Nebula Spin',
    description: 'Gire o cosmos e descubra qual nebulosa premiada aparece.',
    category: 'Arcade',
    payoutMultiplier: 3.75,
    icon: '🪐',
  },
  {
    key: 'tower-quest',
    name: 'Tower Quest',
    description: 'Escolha uma porta do castelo encantado para descobrir o tesouro oculto.',
    category: 'Aventura',
    payoutMultiplier: 3.8,
    icon: '🏰',
  },
  {
    key: 'fortune-cards',
    name: 'Fortune Cards',
    description: 'Quatro cartas místicas, apenas uma entrega o prêmio máximo.',
    category: 'Cartas',
    payoutMultiplier: 3.85,
    icon: '🃏',
  },
  {
    key: 'aurora-pulse',
    name: 'Aurora Pulse',
    description: 'Vibre com as luzes nórdicas e escolha o feixe vencedor.',
    category: 'Arcade',
    payoutMultiplier: 3.9,
    icon: '🌌',
  },
  {
    key: 'quantum-pick',
    name: 'Quantum Pick',
    description: 'Preveja o colapso quântico em uma de quatro dimensões possíveis.',
    category: 'Instant Win',
    payoutMultiplier: 3.82,
    icon: '⚛️',
  },
  {
    key: 'vault-breaker',
    name: 'Vault Breaker',
    description: 'Tente abrir o cofre certo entre quatro combinações secretas.',
    category: 'Aventura',
    payoutMultiplier: 3.78,
    icon: '🗝️',
  },
  {
    key: 'chrono-dash',
    name: 'Chrono Dash',
    description: 'Aposte na linha do tempo correta e capture o prêmio em outra era.',
    category: 'Arcade',
    payoutMultiplier: 3.87,
    icon: '⌛',
  },
  {
    key: 'stellar-sprint',
    name: 'Stellar Sprint',
    description: 'Escolha a nave vencedora numa corrida espacial de quatro rotas.',
    category: 'Arcade',
    payoutMultiplier: 3.84,
    icon: '🚀',
  },
];

export async function initializeDatabase(): Promise<void> {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI não configurado.');
  }

  await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName });

  await seedGames();
  await ensureAdmin();
}

async function seedGames() {
  await Promise.all(
    gameSeeds.map((game) =>
      GameDefinitionModel.updateOne(
        { key: game.key },
        {
          $set: {
            name: game.name,
            description: game.description,
            category: game.category,
            payoutMultiplier: game.payoutMultiplier,
            icon: game.icon,
          },
        },
        { upsert: true }
      )
    )
  );
}

async function ensureAdmin() {
  const admin = await UserModel.findOne({ role: 'admin' }).lean();
  if (!admin) {
    await UserModel.create({
      email: env.adminEmail,
      passwordHash: hashPassword(env.adminPassword),
      role: 'admin',
      phone: '+258840000000',
      age: 30,
      mpesaNumber: '+258840000000',
      balance: 0,
      resetToken: null,
      resetTokenExpires: null,
    });
  }
}
