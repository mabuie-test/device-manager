import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import {
  getOverview,
  getUsers,
  adminResetPassword,
  adminAdjustBalance,
  createFootballMatch,
  getFootballMatches,
  setFootballStatus,
  settleFootballMatch,
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.patch('/users/:userId/password', adminResetPassword);
router.patch('/users/:userId/balance', adminAdjustBalance);

router.post('/football/matches', createFootballMatch);
router.get('/football/matches', getFootballMatches);
router.patch('/football/matches/:matchId/status', setFootballStatus);
router.post('/football/matches/:matchId/settle', settleFootballMatch);

export default router;
