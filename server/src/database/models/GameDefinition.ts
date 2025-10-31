import { Schema, model, type HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface GameDefinitionDoc {
  _id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  payoutMultiplier: number;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const gameDefinitionSchema = new Schema<GameDefinitionDoc>(
  {
    _id: { type: String, default: () => uuid() },
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    payoutMultiplier: { type: Number, required: true },
    icon: { type: String },
  },
  {
    timestamps: true,
  }
);

gameDefinitionSchema.index({ key: 1 }, { unique: true });

export type GameDefinitionDocument = HydratedDocument<GameDefinitionDoc>;
export const GameDefinitionModel = model<GameDefinitionDoc>('GameDefinition', gameDefinitionSchema);
