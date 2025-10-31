import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import {
  createDeposit,
  requestWithdrawal,
  getTransactions,
  mpesaStkCallback,
  mpesaB2CResult,
  mpesaB2CTimeout,
  approveWithdrawalAdmin,
  mpesaC2BValidation,
  mpesaC2BConfirmation,
} from '../controllers/financeController.js';
import { getTransactionsAdmin } from '../controllers/adminController.js';

const router = Router();

router.post('/deposit', authenticate, createDeposit);
router.post('/withdraw', authenticate, requestWithdrawal);
router.get('/transactions', authenticate, getTransactions);
router.post('/mpesa/stk-callback', mpesaStkCallback);
router.post('/mpesa/b2c-result', mpesaB2CResult);
router.post('/mpesa/b2c-timeout', mpesaB2CTimeout);
router.post('/mpesa/c2b-validation', mpesaC2BValidation);
router.post('/mpesa/c2b-confirmation', mpesaC2BConfirmation);

router.get('/admin/transactions', authenticate, requireAdmin, getTransactionsAdmin);
router.post(
  '/admin/withdrawals/:transactionId/approve',
  authenticate,
  requireAdmin,
  approveWithdrawalAdmin
);

export default router;
