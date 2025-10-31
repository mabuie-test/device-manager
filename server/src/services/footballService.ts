import { FootballMatchModel } from '../database/models/index.js';
import { FootballMatch, FootballMarket } from '../types/football.js';

export type CreateMatchPayload = {
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  market: FootballMarket;
};

type FootballSource = {
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
};

function toMatch(record: FootballSource): FootballMatch {
  return {
    id: record._id,
    league: record.league,
    home_team: record.homeTeam,
    away_team: record.awayTeam,
    kickoff: record.kickoff.toISOString(),
    status: record.status,
    market: JSON.stringify(record.market),
    result: record.result ? JSON.stringify(record.result) : null,
    created_at: record.createdAt.toISOString(),
  };
}

export async function createMatch(payload: CreateMatchPayload): Promise<FootballMatch> {
  const doc = await FootballMatchModel.create({
    league: payload.league,
    homeTeam: payload.homeTeam,
    awayTeam: payload.awayTeam,
    kickoff: new Date(payload.kickoff),
    status: 'scheduled',
    market: payload.market,
  });
  return toMatch(doc.toObject() as FootballSource);
}

export async function getMatchById(id: string): Promise<FootballMatch | undefined> {
  const record = await FootballMatchModel.findById(id).lean();
  return record ? toMatch(record as FootballSource) : undefined;
}

export async function listMatches(status?: string): Promise<FootballMatch[]> {
  const query = status ? { status } : {};
  const records = await FootballMatchModel.find(query)
    .sort({ kickoff: status ? 1 : -1 })
    .lean();
  return (records as FootballSource[]).map(toMatch);
}

export async function updateMatchStatus(id: string, status: string): Promise<FootballMatch> {
  const record = await FootballMatchModel.findByIdAndUpdate(
    id,
    { $set: { status, updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!record) {
    throw new Error('Partida não encontrada.');
  }
  return toMatch(record as FootballSource);
}

export async function recordMatchResult(id: string, result: Record<string, unknown>): Promise<FootballMatch> {
  const record = await FootballMatchModel.findByIdAndUpdate(
    id,
    { $set: { result, status: 'settled', updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!record) {
    throw new Error('Partida não encontrada.');
  }
  return toMatch(record as FootballSource);
}
