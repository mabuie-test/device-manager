import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

interface OverviewResponse {
  totals: {
    users: number;
    admins: number;
    players: number;
  };
  finance: {
    totalDeposits: number;
    totalWithdrawals: number;
    pendingCount: number;
  };
  games: Array<{
    gameKey: string;
    totalBets: number;
    totalWager: number;
    totalPayout: number;
    houseEdge: number;
  }>;
  football: {
    scheduled: number;
    settled: number;
  };
}

const AdminDashboardPage = () => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await apiClient.get('/admin/overview');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Falha ao carregar overview admin', err);
        setError('Não foi possível carregar as estatísticas administrativas.');
      }
    };
    void fetchOverview();
  }, []);

  if (error) {
    return <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>;
  }

  if (!data) {
    return <p className="text-slate-400">A carregar estatísticas administrativas…</p>;
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Utilizadores</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{data.totals.users}</p>
          <p className="text-xs text-slate-500">{data.totals.admins} admins · {data.totals.players} jogadores</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Depósitos</p>
          <p className="mt-2 text-3xl font-semibold text-emerald">{data.finance.totalDeposits.toFixed(2)} MT</p>
          <p className="text-xs text-slate-500">Transações concluídas</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Levantamentos</p>
          <p className="mt-2 text-3xl font-semibold text-ocean">{data.finance.totalWithdrawals.toFixed(2)} MT</p>
          <p className="text-xs text-slate-500">Pendentes: {data.finance.pendingCount}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Jogos ativos</p>
          <p className="mt-2 text-3xl font-semibold text-amber">{data.games.length}</p>
          <p className="text-xs text-slate-500">Futebol agendado: {data.football.scheduled}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-8">
        <h2 className="text-lg font-semibold text-slate-100">Rentabilidade por jogo</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Jogo</th>
                <th className="px-3 py-2">Apostas</th>
                <th className="px-3 py-2">Volume apostado</th>
                <th className="px-3 py-2">Pagamentos</th>
                <th className="px-3 py-2">Edge</th>
              </tr>
            </thead>
            <tbody>
              {data.games.map((game) => (
                <tr key={game.gameKey} className="border-t border-white/5">
                  <td className="px-3 py-2 font-semibold text-slate-100">{game.gameKey}</td>
                  <td className="px-3 py-2">{game.totalBets}</td>
                  <td className="px-3 py-2">{game.totalWager.toFixed(2)} MT</td>
                  <td className="px-3 py-2">{game.totalPayout.toFixed(2)} MT</td>
                  <td className="px-3 py-2 text-emerald">{game.houseEdge.toFixed(2)} MT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/withdrawals"
          className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/50 p-6 transition hover:border-ocean/40 hover:shadow-lg hover:shadow-ocean/10"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Supervisão financeira</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">Aprovar levantamentos MPesa</h3>
            <p className="mt-2 text-sm text-slate-400">
              Envie pagamentos automáticos via B2C com dupla verificação e histórico completo.
            </p>
          </div>
          <span className="mt-4 text-sm font-semibold text-ocean">Gerir agora →</span>
        </Link>
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">
          Configure limites de aposta, tempos de espera e novas integrações de provedores diretamente no módulo de jogos.
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">
          Para auditorias externas exporte relatórios a partir do menu de transações com os metadados MPesa anexados.
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
