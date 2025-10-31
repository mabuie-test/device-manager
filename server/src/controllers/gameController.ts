import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { listGames, placeBet, listUserBets, verifyBet } from '../services/gameService.js';

export async function getGames(_req: Request, res: Response) {
  const games = await listGames();
  return res.json({ games });
}

const betSchema = z.object({
  gameKey: z.string(),
  selection: z.coerce.number().min(0).max(3),
  wager: z.coerce.number().positive(),
  clientSeed: z.string().optional(),
});

export async function postBet(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }
  try {
    const payload = betSchema.parse(req.body);
    const result = await placeBet({
      userId: req.user.id,
      gameKey: payload.gameKey,
      selection: payload.selection,
      wager: payload.wager,
      clientSeed: payload.clientSeed,
    });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function getUserHistory(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }
  const bets = await listUserBets(req.user.id);
  return res.json({ bets });
}

const verifySchema = z.object({
  betId: z.string(),
});

export async function verifyBetController(req: Request, res: Response) {
  try {
    const { betId } = verifySchema.parse(req.body);
    const result = await verifyBet(betId);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}
