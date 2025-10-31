import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getGames,
  postBet,
  getUserHistory,
  verifyBetController,
} from '../controllers/gameController.js';

const router = Router();

router.get('/', getGames);
router.post('/bet', authenticate, postBet);
router.get('/bets', authenticate, getUserHistory);
router.post('/verify', verifyBetController);

export default router;
