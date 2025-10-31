import { Schema, model, type HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface BetDoc {
  _id: string;
  userId: string;
  gameKey: string;
  selection: number;
  wager: number;
  outcome: number;
  payout: number;
  win: boolean;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  createdAt: Date;
  updatedAt: Date;
}

const betSchema = new Schema<BetDoc>(
  {
    _id: { type: String, default: () => uuid() },
    userId: { type: String, required: true, index: true },
    gameKey: { type: String, required: true, index: true },
    selection: { type: Number, required: true },
    wager: { type: Number, required: true },
    outcome: { type: Number, required: true },
    payout: { type: Number, required: true },
    win: { type: Boolean, required: true },
    serverSeed: { type: String, required: true },
    serverSeedHash: { type: String, required: true },
    clientSeed: { type: String, required: true },
    nonce: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

betSchema.index({ userId: 1, createdAt: -1 });

export type BetDocument = HydratedDocument<BetDoc>;
export const BetModel = model<BetDoc>('Bet', betSchema);
