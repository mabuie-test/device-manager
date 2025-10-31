import { Schema, model, type HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';

export type TransactionType = 'deposit' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed' | 'rejected';

export interface TransactionDoc {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  channel: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDoc>(
  {
    _id: { type: String, default: () => uuid() },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], required: true, default: 'pending' },
    reference: { type: String, required: true, unique: true },
    channel: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ createdAt: -1 });

export type TransactionDocument = HydratedDocument<TransactionDoc>;
export const TransactionModel = model<TransactionDoc>('Transaction', transactionSchema);
