import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

interface Bet {
  id: string;
  game_key: string;
  wager: number;
  payout: number;
  win: number;
  created_at: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
  reference: string;
  created_at: string;
}

const DashboardPage = () => {
  const { profile, refreshProfile } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [betsResponse, txResponse] = await Promise.all([
          apiClient.get('/games/bets'),
          apiClient.get('/finance/transactions'),
        ]);
        setBets(betsResponse.data.bets);
        setTransactions(txResponse.data.transactions);
        setError(null);
        await refreshProfile();
      } catch (err) {
        console.error('Erro ao carregar dashboard do jogador', err);
        setError('Não foi possível carregar o resumo da sua conta. Verifique a ligação com o servidor.');
      }
    };
    void fetchData();
  }, [refreshProfile]);

  return (
    <div className="space-y-10">
      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      )}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">Saldo disponível</p>
          <p className="mt-3 text-3xl font-semibold text-emerald">{profile?.balance?.toFixed(2)} MT</p>
          <p className="mt-1 text-xs text-slate-500">Actualizado automaticamente após cada aposta ou transação.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">Jogos disputados</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{bets.length}</p>
          <p className="mt-1 text-xs text-slate-500">Histórico das últimas 100 apostas registadas na blockchain interna.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">Transações</p>
          <p className="mt-3 text-3xl font-semibold text-ocean">{transactions.length}</p>
          <p className="mt-1 text-xs text-slate-500">Depósitos, levantamentos e ajustes aprovados pelo administrador.</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Últimas apostas</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {bets.slice(0, 6).map((bet) => (
              <li
                key={bet.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/60 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-200">{bet.game_key}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(bet.created_at).toLocaleString('pt-PT')} · Apostou {bet.wager} MT
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    bet.win ? 'bg-emerald/20 text-emerald' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {bet.win ? `Ganhou ${bet.payout.toFixed(2)} MT` : 'Sem prémio'}
                </span>
              </li>
            ))}
            {!bets.length && <p className="text-sm text-slate-400">Ainda não realizou apostas. Explore os jogos provably fair!</p>}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Movimentos financeiros</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {transactions.slice(0, 6).map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/60 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-200">{tx.type === 'deposit' ? 'Depósito' : 'Levantamento'}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(tx.created_at).toLocaleString('pt-PT')} · Ref: {tx.reference}
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  {tx.amount.toFixed(2)} MT · {tx.status}
                </span>
              </li>
            ))}
            {!transactions.length && <p className="text-sm text-slate-400">Sem transações registadas para já.</p>}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
