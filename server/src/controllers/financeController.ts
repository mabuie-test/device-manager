import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import {
  createTransaction,
  listUserTransactions,
  markTransactionCompleted,
  markTransactionRejected,
  mergeTransactionMetadata,
  findTransactionByCheckoutId,
  findTransactionByConversationId,
  initiateWithdrawalPayout,
} from '../services/financeService.js';
import { getUserById, incrementBalance } from '../services/userService.js';
import {
  initiateSTKPush,
  normalizeMsisdn,
  formatInternationalMsisdn,
  extractMetadata,
} from '../utils/mpesa.js';
import { env } from '../config/env.js';

const depositSchema = z.object({
  amount: z.coerce.number().positive(),
  phoneNumber: z.string().min(9),
});

export async function createDeposit(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }
  try {
    const payload = depositSchema.parse(req.body);
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    const msisdn = normalizeMsisdn(payload.phoneNumber);
    if (!msisdn) {
      return res.status(400).json({ message: 'Número MPesa inválido.' });
    }
    const displayPhone = formatInternationalMsisdn(payload.phoneNumber);
    const reference = `DEP-${Date.now()}`;
    const tx = await createTransaction({
      userId: user.id,
      type: 'deposit',
      amount: payload.amount,
      reference,
      channel: 'MPESA',
      metadata: {
        mpesa: {
          msisdn,
          displayPhone,
          status: 'initiated',
        },
      },
    });

    const callbackUrl = `${env.mpesa.callbackBaseUrl}/api/finance/mpesa/stk-callback`;

    try {
      const stkResponse = await initiateSTKPush({
        amount: payload.amount,
        phoneNumber: msisdn,
        reference,
        callbackUrl,
        description: 'Recarga BetPulse',
      });
      await mergeTransactionMetadata(tx.id, {
        mpesa: {
          msisdn,
          displayPhone,
          status: 'pending',
          merchantRequestId: stkResponse.MerchantRequestID,
          checkoutRequestId: stkResponse.CheckoutRequestID,
          customerMessage: stkResponse.CustomerMessage,
        },
      });
    } catch (mpesaError) {
      await markTransactionRejected(tx.id, 'Falha ao iniciar STK Push');
      console.warn('Falha ao contactar M-Pesa:', mpesaError);
      return res.status(502).json({
        message: 'Não foi possível iniciar o pedido no MPesa. Tente novamente em instantes.',
      });
    }

    return res.status(201).json({
      transaction: tx,
      message: 'Depósito iniciado. Complete a operação no seu MPesa.',
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive(),
  phoneNumber: z.string().min(9),
});

export async function requestWithdrawal(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }
  try {
    const payload = withdrawalSchema.parse(req.body);
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    if (user.balance < payload.amount) {
      return res.status(400).json({ message: 'Saldo insuficiente.' });
    }
    await incrementBalance(user.id, -payload.amount);
    const msisdn = normalizeMsisdn(payload.phoneNumber);
    if (!msisdn) {
      return res.status(400).json({ message: 'Número MPesa inválido.' });
    }
    const displayPhone = formatInternationalMsisdn(payload.phoneNumber);
    const tx = await createTransaction({
      userId: user.id,
      type: 'withdrawal',
      amount: payload.amount,
      reference: `WDL-${Date.now()}`,
      channel: 'MPESA',
      metadata: {
        mpesa: {
          msisdn,
          displayPhone,
          status: 'pending',
        },
      },
    });
    return res.status(201).json({
      transaction: tx,
      message: 'Pedido de levantamento registado e em análise.',
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function getTransactions(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }
  const transactions = await listUserTransactions(req.user.id);
  return res.json({ transactions });
}

const approveWithdrawalSchema = z.object({
  remarks: z.string().max(140).optional(),
});

export async function approveWithdrawalAdmin(req: Request, res: Response) {
  const { transactionId } = req.params;
  try {
    const payload = approveWithdrawalSchema.parse(req.body ?? {});
    const result = await initiateWithdrawalPayout(transactionId, payload.remarks);
    return res.json({
      message: 'Pagamento enviado ao MPesa para processamento.',
      mpesa: result,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

const mpesaStkCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            })
          ),
        })
        .optional(),
    }),
  }),
});

export async function mpesaStkCallback(req: Request, res: Response) {
  try {
    const payload = mpesaStkCallbackSchema.parse(req.body);
    const { stkCallback } = payload.Body;
    const transaction = await findTransactionByCheckoutId(stkCallback.CheckoutRequestID);
    if (!transaction) {
      return res.json({ message: 'Transação não localizada para este checkout.' });
    }

    const metadataItems = extractMetadata(stkCallback.CallbackMetadata?.Item);
    const patch = {
      mpesa: {
        status: stkCallback.ResultCode === 0 ? 'completed' : 'failed',
        checkoutRequestId: stkCallback.CheckoutRequestID,
        merchantRequestId: stkCallback.MerchantRequestID,
        resultCode: stkCallback.ResultCode,
        resultDescription: stkCallback.ResultDesc,
        receipt: metadataItems.MpesaReceiptNumber,
        amount: metadataItems.Amount,
        transactionDate: metadataItems.TransactionDate,
        msisdn: metadataItems.PhoneNumber,
      },
    };

    await mergeTransactionMetadata(transaction._id, patch);

    if (stkCallback.ResultCode === 0) {
      await markTransactionCompleted(transaction._id);
    } else {
      await markTransactionRejected(transaction._id, stkCallback.ResultDesc);
    }

    return res.json({ message: 'Callback processado.' });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

const mpesaB2CResultSchema = z.object({
  Result: z.object({
    ResultCode: z.number(),
    ResultDesc: z.string(),
    ConversationID: z.string(),
    OriginatorConversationID: z.string(),
    TransactionID: z.string().optional(),
    ResultParameters: z
      .object({
        ResultParameter: z.array(
          z.object({
            Key: z.string(),
            Value: z.union([z.string(), z.number()]).optional(),
          })
        ),
      })
      .optional(),
  }),
});

export async function mpesaB2CResult(req: Request, res: Response) {
  try {
    const payload = mpesaB2CResultSchema.parse(req.body);
    const { Result } = payload;
    const transaction = await findTransactionByConversationId(Result.ConversationID);
    if (!transaction) {
      return res.json({ message: 'Resultado recebido sem transação associada.' });
    }

    const parameterItems = Result.ResultParameters?.ResultParameter?.reduce<Record<string, string | number | undefined>>(
      (acc, item) => ({ ...acc, [item.Key]: item.Value }),
      {}
    );

    const patch = {
      mpesa: {
        status: Result.ResultCode === 0 ? 'paid' : 'failed',
        conversationId: Result.ConversationID,
        originatorConversationId: Result.OriginatorConversationID,
        resultCode: Result.ResultCode,
        resultDescription: Result.ResultDesc,
        transactionId: Result.TransactionID,
        payoutAmount: parameterItems?.TransactionAmount,
        receiver: parameterItems?.ReceiverPartyPublicName,
        completedAt: new Date().toISOString(),
      },
    };

    await mergeTransactionMetadata(transaction._id, patch);

    if (Result.ResultCode === 0) {
      await markTransactionCompleted(transaction._id);
    } else {
      await markTransactionRejected(transaction._id, Result.ResultDesc);
    }

    return res.json({ message: 'Resultado B2C tratado.' });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function mpesaB2CTimeout(req: Request, res: Response) {
  console.warn('Timeout de B2C recebido do MPesa:', req.body);
  return res.json({ message: 'Timeout registado.' });
}

export async function mpesaC2BValidation(req: Request, res: Response) {
  console.info('Validação C2B recebida:', req.body);
  return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

export async function mpesaC2BConfirmation(req: Request, res: Response) {
  console.info('Confirmação C2B recebida:', req.body);
  return res.json({ ResultCode: 0, ResultDesc: 'Processed' });
}
