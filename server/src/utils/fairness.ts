import crypto from 'node:crypto';

export type ProvablyFairResult = {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  roll: number;
};

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashServerSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

export function generateClientSeed(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function computeRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const digest = hmac.digest('hex');
  const number = parseInt(digest.substring(0, 8), 16);
  return number % 4; // probability 1/4
}

export function buildFairResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): ProvablyFairResult {
  return {
    serverSeed,
    serverSeedHash: hashServerSeed(serverSeed),
    clientSeed,
    nonce,
    roll: computeRoll(serverSeed, clientSeed, nonce),
  };
}
