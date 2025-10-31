import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  sub: string;
  role: 'admin' | 'player';
}

export function signToken(payload: TokenPayload, expiresIn = '12h'): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
