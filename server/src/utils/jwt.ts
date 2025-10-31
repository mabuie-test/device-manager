import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  sub: string;
  role: 'admin' | 'player';
}

const secret: Secret = env.jwtSecret;

export function signToken(payload: TokenPayload, expiresIn: string | number = '12h'): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}
