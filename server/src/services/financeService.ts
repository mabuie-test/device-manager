import { TransactionModel } from '../database/models/index.js';
import { incrementBalance } from './userService.js';
import { TransactionRecord, TransactionType } from '../types/finance.js';
import { triggerB2CPayout } from '../utils/mpesa.js';

export type TransactionPayload = {
  userId: string;
  type: TransactionType;
  amount: number;
  reference: string;
  channel: string;
  metadata?: Record<string, unknown>;
};

export type TransactionSource = {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  reference: string;
  channel: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

function toTransaction(record: TransactionSource): TransactionRecord {
  return {
    id: record._id,
    user_id: record.userId,
    type: record.type,
    amount: record.amount,
    status: record.status,
    reference: record.reference,
    channel: record.channel,
    metadata: record.metadata ? JSON.stringify(record.metadata) : null,
    created_at: record.createdAt.toISOString(),
  };
}

export async function createTransaction(payload: TransactionPayload): Promise<TransactionRecord> {
  const doc = await TransactionModel.create({
    userId: payload.userId,
    type: payload.type,
    amount: payload.amount,
    reference: payload.reference,
    channel: payload.channel,
    metadata: payload.metadata ?? null,
  });
  return toTransaction(doc.toObject() as TransactionSource);
}

function deepMerge(
  source: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...source };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const existing = result[key];
      if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        result[key] = deepMerge(existing as Record<string, unknown>, value as Record<string, unknown>);
      } else {
        result[key] = deepMerge({}, value as Record<string, unknown>);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function mergeTransactionMetadata(
  id: string,
  patch: Record<string, unknown>
): Promise<TransactionRecord> {
  const tx = await TransactionModel.findById(id).exec();
  if (!tx) {
    throw new Error('Transação não encontrada.');
  }
  const current = (tx.metadata as Record<string, unknown> | null) ?? {};
  tx.metadata = deepMerge(current, patch);
  await tx.save();
  return toTransaction(tx.toObject() as TransactionSource);
}

export async function findTransactionByCheckoutId(
  checkoutRequestId: string
): Promise<TransactionSource | null> {
  const record = await TransactionModel.findOne({
    'metadata.mpesa.checkoutRequestId': checkoutRequestId,
  })
    .lean()
    .exec();
  return (record as TransactionSource | null) ?? null;
}

export async function findTransactionByConversationId(
  conversationId: string
): Promise<TransactionSource | null> {
  const record = await TransactionModel.findOne({
    $or: [
      { 'metadata.mpesa.conversationId': conversationId },
      { 'metadata.mpesa.originatorConversationId': conversationId },
    ],
  })
    .lean()
    .exec();
  return (record as TransactionSource | null) ?? null;
}

export async function markTransactionCompleted(id: string): Promise<void> {
  const tx = await TransactionModel.findById(id).exec();
  if (!tx) {
    throw new Error('Transação não encontrada.');
  }
  if (tx.status === 'completed') {
    return;
  }
  tx.status = 'completed';
  await tx.save();

  if (tx.type === 'deposit') {
    await incrementBalance(tx.userId, tx.amount);
  }
}

export async function markTransactionCompletedByReference(reference: string): Promise<void> {
  const tx = await TransactionModel.findOne({ reference }).exec();
  if (!tx) {
    throw new Error('Transação não encontrada.');
  }
  await markTransactionCompleted(tx.id);
}

export async function markTransactionRejected(id: string, reason?: string): Promise<void> {
  const tx = await TransactionModel.findById(id).exec();
  if (!tx) {
    throw new Error('Transação não encontrada.');
  }
  const metadata = { ...(tx.metadata ?? {}), ...(reason ? { reason } : {}) };
  tx.status = 'rejected';
  tx.metadata = Object.keys(metadata).length ? metadata : null;
  await tx.save();

  if (tx.type === 'withdrawal') {
    await incrementBalance(tx.userId, tx.amount);
  }
}

export async function listTransactions(limit = 200): Promise<TransactionRecord[]> {
  const records = await TransactionModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return (records as TransactionSource[]).map(toTransaction);
}

export async function listUserTransactions(userId: string, limit = 100): Promise<TransactionRecord[]> {
  const records = await TransactionModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return (records as TransactionSource[]).map(toTransaction);
}

export async function summarizeFinance() {
  const [summary] = await TransactionModel.aggregate<{
    totalDeposits: number;
    totalWithdrawals: number;
    pendingCount: number;
  }>([
    {
      $group: {
        _id: '$status',
        deposits: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$type', 'deposit'] }, { $eq: ['$status', 'completed'] }] }, '$amount', 0],
          },
        },
        withdrawals: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$type', 'withdrawal'] }, { $eq: ['$status', 'completed'] }] }, '$amount', 0],
          },
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalDeposits: { $sum: '$deposits' },
        totalWithdrawals: { $sum: '$withdrawals' },
        pendingCount: { $sum: '$pending' },
      },
    },
  ]).exec();

  return {
    totalDeposits: Number(summary?.totalDeposits || 0),
    totalWithdrawals: Number(summary?.totalWithdrawals || 0),
    pendingCount: Number(summary?.pendingCount || 0),
  };
}

export async function initiateWithdrawalPayout(
  transactionId: string,
  remarks?: string
): Promise<{
  conversationId: string;
  originatorConversationId: string;
  description: string;
}> {
  const tx = await TransactionModel.findById(transactionId).exec();
  if (!tx) {
    throw new Error('Transação não encontrada.');
  }
  if (tx.type !== 'withdrawal') {
    throw new Error('Apenas levantamentos podem ser aprovados.');
  }
  if (tx.status !== 'pending') {
    throw new Error('A transação já foi processada.');
  }

  const metadata = (tx.metadata as Record<string, unknown> | null) ?? {};
  const mpesaExisting = (metadata as { mpesa?: Record<string, unknown> }).mpesa ?? {};
  const msisdn = (mpesaExisting.msisdn as string | undefined) || (mpesaExisting.phoneNumber as string | undefined);

  if (!msisdn) {
    throw new Error('Transação sem número MPesa associado.');
  }

  const response = await triggerB2CPayout({
    amount: tx.amount,
    phoneNumber: msisdn,
    reference: tx.reference,
    remarks,
  });

  const updated = deepMerge(metadata, {
    mpesa: {
      ...mpesaExisting,
      status: 'processing',
      msisdn,
      conversationId: response.ConversationID,
      originatorConversationId: response.OriginatorConversationID,
      responseDescription: response.ResponseDescription,
    },
  });

  tx.metadata = updated;
  await tx.save();

  return {
    conversationId: response.ConversationID,
    originatorConversationId: response.OriginatorConversationID,
    description: response.ResponseDescription,
  };
}
