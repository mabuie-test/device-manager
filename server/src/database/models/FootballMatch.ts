import { Schema, model, type HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface FootballMatchDoc {
  _id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  status: string;
  market: Record<string, unknown>;
  result: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const footballMatchSchema = new Schema<FootballMatchDoc>(
  {
    _id: { type: String, default: () => uuid() },
    league: { type: String, required: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    kickoff: { type: Date, required: true },
    status: { type: String, required: true, default: 'scheduled' },
    market: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

footballMatchSchema.index({ status: 1, kickoff: -1 });

export type FootballMatchDocument = HydratedDocument<FootballMatchDoc>;
export const FootballMatchModel = model<FootballMatchDoc>('FootballMatch', footballMatchSchema);
