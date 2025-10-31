import { Request, Response } from 'express';
import { listMessages } from '../services/chatService.js';

export async function getChatHistory(_req: Request, res: Response) {
  const messages = await listMessages();
  return res.json({ messages });
}
