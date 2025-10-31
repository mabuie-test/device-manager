import { Request, Response } from 'express';
import { z } from 'zod';
import { listUsers, updatePassword, updateUserBalance, getUserById } from '../services/userService.js';
import { listTransactions, summarizeFinance } from '../services/financeService.js';
import { getGameStatistics } from '../services/gameService.js';
import {
  createMatch,
  listMatches,
  updateMatchStatus,
  recordMatchResult,
} from '../services/footballService.js';
import { User } from '../types/user.js';

export async function getOverview(_req: Request, res: Response) {
  const [users, finance, games, scheduled, settled] = await Promise.all([
    listUsers(),
    summarizeFinance(),
    getGameStatistics(),
    listMatches('scheduled'),
    listMatches('settled'),
  ]);

  return res.json({
    totals: {
      users: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      players: users.filter((u) => u.role === 'player').length,
    },
    finance,
    games,
    football: {
      scheduled: scheduled.length,
      settled: settled.length,
    },
  });
}

export async function getUsers(_req: Request, res: Response) {
  const users = await listUsers();
  return res.json({ users: users.map(stripSensitive) });
}

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

export async function adminResetPassword(req: Request, res: Response) {
  const { userId } = req.params;
  try {
    const payload = resetPasswordSchema.parse(req.body);
    await updatePassword(userId, payload.password);
    return res.json({ message: 'Senha atualizada.' });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

const adjustBalanceSchema = z.object({
  balance: z.coerce.number(),
});

export async function adminAdjustBalance(req: Request, res: Response) {
  const { userId } = req.params;
  try {
    const payload = adjustBalanceSchema.parse(req.body);
    await updateUserBalance(userId, payload.balance);
    const user = await getUserById(userId);
    return res.json({ message: 'Saldo atualizado.', user: user ? stripSensitive(user) : null });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function getTransactionsAdmin(_req: Request, res: Response) {
  const transactions = await listTransactions();
  return res.json({ transactions });
}

const createMatchSchema = z.object({
  league: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  kickoff: z.string(),
  market: z.object({
    marketType: z.string(),
    options: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        odds: z.coerce.number().positive(),
      })
    ),
  }),
});

export async function createFootballMatch(req: Request, res: Response) {
  try {
    const payload = createMatchSchema.parse(req.body);
    const match = await createMatch(payload);
    return res.status(201).json({ match });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function getFootballMatches(_req: Request, res: Response) {
  const matches = await listMatches();
  return res.json({ matches });
}

const updateMatchSchema = z.object({
  status: z.string(),
});

export async function setFootballStatus(req: Request, res: Response) {
  const { matchId } = req.params;
  try {
    const payload = updateMatchSchema.parse(req.body);
    const match = await updateMatchStatus(matchId, payload.status);
    return res.json({ match });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

const settleSchema = z.object({
  result: z.record(z.any()),
});

export async function settleFootballMatch(req: Request, res: Response) {
  const { matchId } = req.params;
  try {
    const payload = settleSchema.parse(req.body);
    const match = await recordMatchResult(matchId, payload.result);
    return res.json({ match });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

function stripSensitive(user: User | null | undefined) {
  if (!user) return null;
  const { password_hash, reset_token, reset_token_expires, ...rest } = user;
  return rest;
}
