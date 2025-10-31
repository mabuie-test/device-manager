import { BetModel, GameDefinitionModel, UserModel } from '../database/models/index.js';
import { GameDefinition, BetRecord } from '../types/game.js';
import { generateClientSeed, generateServerSeed, hashServerSeed, computeRoll } from '../utils/fairness.js';
import { getUserById, incrementBalance } from './userService.js';

export type BetPayload = {
  userId: string;
  gameKey: string;
  selection: number;
  wager: number;
  clientSeed?: string;
};

type GameSource = {
  _id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  payoutMultiplier: number;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
};

type BetSource = {
  _id: string;
  userId: string;
  gameKey: string;
  selection: number;
  wager: number;
  outcome: number;
  payout: number;
  win: boolean;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  createdAt: Date;
  updatedAt: Date;
};

function toGame(game: GameSource): GameDefinition {
  return {
    key: game.key,
    name: game.name,
    description: game.description,
    category: game.category,
    payout_multiplier: game.payoutMultiplier,
    icon: game.icon,
  };
}

function toBet(record: BetSource): BetRecord {
  return {
    id: record._id,
    user_id: record.userId,
    game_key: record.gameKey,
    selection: record.selection,
    wager: record.wager,
    outcome: record.outcome,
    payout: record.payout,
    win: record.win ? 1 : 0,
    server_seed: record.serverSeed,
    server_seed_hash: record.serverSeedHash,
    client_seed: record.clientSeed,
    nonce: record.nonce,
    created_at: record.createdAt.toISOString(),
  };
}

async function fetchGame(gameKey: string): Promise<GameSource> {
  const record = await GameDefinitionModel.findOne({ key: gameKey }).lean();
  if (!record) {
    throw new Error('Jogo não encontrado.');
  }
  return record as GameSource;
}

export async function listGames(): Promise<GameDefinition[]> {
  const records = await GameDefinitionModel.find().sort({ name: 1 }).lean();
  return (records as GameSource[]).map(toGame);
}

export async function listUserBets(userId: string): Promise<BetRecord[]> {
  const records = await BetModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return (records as BetSource[]).map(toBet);
}

export async function placeBet(payload: BetPayload) {
  const user = await getUserById(payload.userId);
  if (!user) {
    throw new Error('Utilizador não encontrado.');
  }

  const game = await fetchGame(payload.gameKey);

  if (payload.selection < 0 || payload.selection > 3) {
    throw new Error('Seleção inválida.');
  }
  if (payload.wager <= 0) {
    throw new Error('O valor da aposta deve ser superior a zero.');
  }

  const debitResult = await UserModel.updateOne(
    { _id: user.id, balance: { $gte: payload.wager } },
    { $inc: { balance: -payload.wager }, $set: { updatedAt: new Date() } }
  ).exec();

  if (debitResult.matchedCount === 0 || debitResult.modifiedCount === 0) {
    throw new Error('Saldo insuficiente.');
  }

  const serverSeed = generateServerSeed();
  const clientSeed = payload.clientSeed ?? generateClientSeed();
  const nonce = (await BetModel.countDocuments({ userId: user.id })) + 1;
  const serverSeedHash = hashServerSeed(serverSeed);
  const outcome = computeRoll(serverSeed, clientSeed, nonce);
  const win = outcome === payload.selection;
  const payout = win ? Number((payload.wager * game.payoutMultiplier).toFixed(2)) : 0;

  const betDoc = await BetModel.create({
    userId: user.id,
    gameKey: game.key,
    selection: payload.selection,
    wager: payload.wager,
    outcome,
    payout,
    win,
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
  });

  if (payout > 0) {
    await incrementBalance(user.id, payout);
  }

  const updatedUser = await getUserById(user.id);
  const bet = toBet(betDoc.toObject() as BetSource);

  return {
    bet,
    balance: updatedUser?.balance ?? 0,
    fairness: {
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      outcome,
    },
    payout,
    win,
  };
}

export async function verifyBet(betId: string) {
  const record = await BetModel.findById(betId).lean();
  if (!record) {
    throw new Error('Aposta não encontrada.');
  }
  const betRecord = record as BetSource;
  const recalculated = computeRoll(betRecord.serverSeed, betRecord.clientSeed, betRecord.nonce);
  return {
    bet: toBet(betRecord),
    roll: recalculated,
    isValid: recalculated === betRecord.outcome,
  };
}

export async function getGameStatistics() {
  const rows = await BetModel.aggregate<{
    _id: string;
    totalBets: number;
    totalPayout: number;
    totalWager: number;
  }>([
    {
      $group: {
        _id: '$gameKey',
        totalBets: { $sum: 1 },
        totalPayout: { $sum: '$payout' },
        totalWager: { $sum: '$wager' },
      },
    },
  ]).exec();

  return rows.map((row) => ({
    gameKey: row._id,
    totalBets: Number(row.totalBets || 0),
    totalWager: Number(row.totalWager || 0),
    totalPayout: Number(row.totalPayout || 0),
    houseEdge: Number(row.totalWager || 0) - Number(row.totalPayout || 0),
  }));
}
