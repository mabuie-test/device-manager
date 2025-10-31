import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getChatHistory } from '../controllers/chatController.js';

const router = Router();

router.get('/history', authenticate, getChatHistory);

export default router;
