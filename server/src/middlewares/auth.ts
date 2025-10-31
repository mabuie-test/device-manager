import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { getUserById } from '../services/userService.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'player';
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.get('authorization');
  if (!header) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }
  const [, token] = header.split(' ');
  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Utilizador inválido.' });
    }
    req.user = { id: user.id, role: payload.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso restrito ao administrador.' });
  }
  next();
}
