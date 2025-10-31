export type TransactionType = 'deposit' | 'withdrawal';

export interface TransactionRecord {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  status: string;
  reference: string;
  channel: string;
  metadata: string | null;
  created_at: string;
}
