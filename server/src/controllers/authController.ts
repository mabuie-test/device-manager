import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import {
  authenticateUser,
  getUserById,
  registerUser,
  setResetToken,
  clearResetToken,
  updatePassword,
  updateProfile,
  getUserByEmail,
  getUserByResetToken,
} from '../services/userService.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { User } from '../types/user.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(7),
  age: z.coerce.number().min(18),
  mpesaNumber: z.string().min(9),
});

export async function register(req: Request, res: Response) {
  try {
    const payload = registerSchema.parse(req.body);
    const user = await registerUser(payload);
    const token = signToken({ sub: user.id, role: 'player' });
    return res.status(201).json({
      message: 'Registo concluído com sucesso.',
      token,
      profile: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function login(req: Request, res: Response) {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await authenticateUser(payload.email, payload.password);
    const token = signToken({ sub: user.id, role: user.role });
    return res.json({ token, profile: sanitizeUser(user) });
  } catch (error) {
    return res.status(401).json({ message: (error as Error).message });
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }
  const user = await getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Utilizador não encontrado.' });
  }
  return res.json({ profile: sanitizeUser(user) });
}

const updateProfileSchema = z.object({
  phone: z.string().min(7).optional(),
  mpesa_number: z.string().min(9).optional(),
});

export async function updateProfileController(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }
  try {
    const payload = updateProfileSchema.parse(req.body);
    const user = await updateProfile(req.user.id, payload);
    return res.json({ profile: sanitizeUser(user) });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

const resetRequestSchema = z.object({
  email: z.string().email(),
});

export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = resetRequestSchema.parse(req.body);
    const user = await getUserByEmail(email);
    if (user) {
      const token = crypto.randomBytes(24).toString('hex');
      const expires = Date.now() + 1000 * 60 * 30;
      await setResetToken(user.id, token, expires);
      console.info(`Token de recuperação (${email}): ${token}`);
    }
    return res.json({ message: 'Se o e-mail existir, enviaremos instruções de recuperação.' });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = resetSchema.parse(req.body);
    const user = await getUserByResetToken(token);
    if (!user || !user.reset_token_expires || user.reset_token_expires < Date.now()) {
      return res.status(400).json({ message: 'Token inválido ou expirado.' });
    }
    await updatePassword(user.id, password);
    await clearResetToken(user.id);
    return res.json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

function sanitizeUser(user: User) {
  const { password_hash, reset_token, reset_token_expires, ...rest } = user;
  return rest;
}
