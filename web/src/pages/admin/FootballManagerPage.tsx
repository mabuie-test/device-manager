import { FormEvent, useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';

interface Match {
  id: string;
  league: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  status: string;
  market: string;
  result: string | null;
}

const FootballManagerPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [form, setForm] = useState({
    league: '',
    homeTeam: '',
    awayTeam: '',
    kickoff: '',
    marketType: '1x2',
    oddsHome: 2.1,
    oddsDraw: 3.0,
    oddsAway: 3.2,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      const response = await apiClient.get('/admin/football/matches');
      setMatches(response.data.matches);
      setLoadError(null);
    } catch (error) {
      console.error('Erro ao carregar partidas de futebol', error);
      setLoadError('Não foi possível carregar a lista de partidas.');
    }
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await apiClient.post('/admin/football/matches', {
        league: form.league,
        homeTeam: form.homeTeam,
        awayTeam: form.awayTeam,
        kickoff: form.kickoff,
        market: {
          marketType: form.marketType,
          options: [
            { key: 'HOME', label: form.homeTeam, odds: Number(form.oddsHome) },
            { key: 'DRAW', label: 'Empate', odds: Number(form.oddsDraw) },
            { key: 'AWAY', label: form.awayTeam, odds: Number(form.oddsAway) },
          ],
        },
      });
      setFeedback('Partida adicionada com sucesso.');
      await loadMatches();
    } catch (error) {
      setFeedback((error as Error).message || 'Erro ao criar partida.');
    }
  };

  const settleMatch = async (matchId: string, result: Record<string, unknown>) => {
    try {
      await apiClient.post(`/admin/football/matches/${matchId}/settle`, { result });
      await loadMatches();
      setFeedback('Partida liquidada com sucesso.');
    } catch (error) {
      console.error('Erro ao liquidar partida', error);
      setFeedback((error as Error).message || 'Não foi possível liquidar a partida.');
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-[1.1fr,1fr]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-8">
        <h2 className="text-xl font-semibold text-slate-100">Agendar nova partida</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Competição</label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              value={form.league}
              onChange={(event) => setForm((prev) => ({ ...prev, league: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Data/hora</label>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              value={form.kickoff}
              onChange={(event) => setForm((prev) => ({ ...prev, kickoff: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Equipa casa</label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              value={form.homeTeam}
              onChange={(event) => setForm((prev) => ({ ...prev, homeTeam: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Equipa visitante</label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              value={form.awayTeam}
              onChange={(event) => setForm((prev) => ({ ...prev, awayTeam: event.target.value }))}
              required
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-slate-300">Odd casa</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              value={form.oddsHome}
              onChange={(event) => setForm((prev) => ({ ...prev, oddsHome: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Odd empate</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              value={form.oddsDraw}
              onChange={(event) => setForm((prev) => ({ ...prev, oddsDraw: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Odd visitante</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              value={form.oddsAway}
              onChange={(event) => setForm((prev) => ({ ...prev, oddsAway: event.target.value }))}
              required
            />
          </div>
        </div>
        {feedback && <p className="rounded-2xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald">{feedback}</p>}
        <button className="w-full rounded-full bg-amber px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber/80">
          Agendar partida
        </button>
      </form>

      <section className="space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/30 p-6">
        <h3 className="text-lg font-semibold text-slate-100">Partidas registadas</h3>
        {loadError && (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{loadError}</p>
        )}
        {matches.map((match) => (
          <div key={match.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-100">
                {match.home_team} vs {match.away_team}
              </p>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                {match.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">{new Date(match.kickoff).toLocaleString('pt-PT')} · {match.league}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              {(() => {
                const parsed = JSON.parse(match.market) as { options: Array<{ key: string; label: string; odds: number }> };
                return parsed.options.map((option) => (
                  <span key={option.key} className="rounded-full bg-slate-900 px-3 py-1">
                    {option.label}: {option.odds}
                  </span>
                ));
              })()}
            </div>
            {match.status !== 'settled' ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => settleMatch(match.id, { winner: 'HOME' })}
                  className="rounded-full bg-emerald/20 px-4 py-2 text-xs font-semibold text-emerald hover:bg-emerald/30"
                >
                  Confirmar casa
                </button>
                <button
                  onClick={() => settleMatch(match.id, { winner: 'DRAW' })}
                  className="rounded-full bg-ocean/20 px-4 py-2 text-xs font-semibold text-ocean hover:bg-ocean/30"
                >
                  Confirmar empate
                </button>
                <button
                  onClick={() => settleMatch(match.id, { winner: 'AWAY' })}
                  className="rounded-full bg-amber/20 px-4 py-2 text-xs font-semibold text-amber hover:bg-amber/30"
                >
                  Confirmar visitante
                </button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-emerald">Resultado: {match.result}</p>
            )}
          </div>
        ))}
        {!matches.length && <p className="text-sm text-slate-400">Ainda não existem partidas registadas.</p>}
      </section>
    </div>
  );
};

export default FootballManagerPage;
