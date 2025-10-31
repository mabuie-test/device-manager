import { FormEvent, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import MiniGamesShowcase from '../components/mini-games/MiniGamesShowcase';

interface Game {
  key: string;
  name: string;
  description: string;
  category: string;
  payout_multiplier: number;
  icon?: string;
}

interface BetResponse {
  bet: {
    id: string;
    game_key: string;
    selection: number;
    wager: number;
    outcome: number;
    payout: number;
    win: number;
  };
  balance: number;
  fairness: {
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    outcome: number;
  };
  payout: number;
  win: boolean;
}

const choices = [
  { id: 0, label: 'Quadrante A' },
  { id: 1, label: 'Quadrante B' },
  { id: 2, label: 'Quadrante C' },
  { id: 3, label: 'Quadrante D' },
];

const GamesPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [choice, setChoice] = useState(0);
  const [wager, setWager] = useState(50);
  const [clientSeed, setClientSeed] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickPlayLoading, setQuickPlayLoading] = useState<string | null>(null);
  const [quickFeedback, setQuickFeedback] = useState<{
    gameKey: string;
    message: string;
    tone: 'success' | 'neutral' | 'error';
  } | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      const response = await apiClient.get('/games');
      setGames(response.data.games);
    };
    void fetchGames();
  }, []);

  const handleBet = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGame) return;
    setMessage(null);
    setLoading(true);
    try {
      const response = await apiClient.post<BetResponse>('/games/bet', {
        gameKey: selectedGame.key,
        selection: choice,
        wager: Number(wager),
        clientSeed: clientSeed || undefined,
      });
      const data = response.data;
      setMessage(
        data.win
          ? `🎉 Vitória! Resultado ${data.fairness.outcome} com payout de ${data.payout.toFixed(2)} MT.`
          : `Sem prémio desta vez. Resultado ${data.fairness.outcome}. Seeds: ${data.fairness.serverSeedHash}`
      );
    } catch (error) {
      setMessage((error as Error).message || 'Falha ao enviar aposta.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPlay = async (game: Game) => {
    setQuickPlayLoading(game.key);
    setQuickFeedback(null);
    try {
      const randomPick = Math.floor(Math.random() * choices.length);
      const response = await apiClient.post<BetResponse>('/games/bet', {
        gameKey: game.key,
        selection: randomPick,
        wager: 25,
      });
      const data = response.data;
      setQuickFeedback({
        gameKey: game.key,
        message: data.win
          ? `🎉 Vitória rápida! Recebeu ${data.payout.toFixed(2)} MT em ${game.name}.`
          : `Resultado ${data.fairness.outcome}. Continue a tentar para capitalizar o edge da casa.`,
        tone: data.win ? 'success' : 'neutral',
      });
      setSelectedGame(game);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível lançar o mini jogo.';
      setQuickFeedback({ gameKey: game.key, message: errorMessage, tone: 'error' });
    } finally {
      setQuickPlayLoading(null);
    }
  };

  return (
    <div className="space-y-10">
      <MiniGamesShowcase
        games={games}
        onSelect={setSelectedGame}
        onQuickPlay={handleQuickPlay}
        loadingKey={quickPlayLoading}
        feedback={quickFeedback}
      />
      <div className="grid gap-6 md:grid-cols-3">
        {games.map((game) => (
          <button
            key={game.key}
            onClick={() => setSelectedGame(game)}
            className={`rounded-3xl border px-6 py-6 text-left transition hover:shadow-xl hover:shadow-ocean/10 ${
              selectedGame?.key === game.key
                ? 'border-ocean bg-slate-900/80'
                : 'border-white/10 bg-slate-900/50'
            }`}
          >
            <span className="text-3xl">{game.icon ?? '🎲'}</span>
            <h2 className="mt-4 text-xl font-semibold text-slate-100">{game.name}</h2>
            <p className="mt-2 text-sm text-slate-400">{game.description}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-emerald">Retorno até {game.payout_multiplier}x</p>
          </button>
        ))}
      </div>

      {selectedGame ? (
        <form
          onSubmit={handleBet}
          className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-lg shadow-emerald/10"
        >
          <h3 className="text-lg font-semibold text-slate-100">
            Aposta em {selectedGame.name} ({selectedGame.payout_multiplier}x)
          </h3>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Escolha a zona vencedora</label>
              <div className="grid grid-cols-2 gap-3">
                {choices.map((option) => (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm transition ${
                      choice === option.id
                        ? 'border-emerald bg-emerald/10 text-emerald'
                        : 'border-white/10 bg-slate-950/60 text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selection"
                      value={option.id}
                      className="hidden"
                      checked={choice === option.id}
                      onChange={() => setChoice(option.id)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Valor da aposta (MT)</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/40"
                value={wager}
                onChange={(event) => setWager(Number(event.target.value))}
              />
              <p className="text-xs text-slate-400">
                Pagamento potencial: {(Number(wager) * selectedGame.payout_multiplier).toFixed(2)} MT
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-slate-300">Client seed (opcional)</label>
            <input
              type="text"
              placeholder="Forneça o seu seed para verificação"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/40"
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
            />
            <p className="text-xs text-slate-500">
              Se não preencher, geraremos automaticamente um seed criptograficamente seguro.
            </p>
          </div>
          {message && <p className="mt-4 rounded-2xl border border-ocean/30 bg-ocean/10 px-4 py-3 text-sm text-ocean">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald/80 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'A enviar…' : 'Confirmar aposta'}
          </button>
        </form>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-center text-slate-400">
          Selecione um jogo acima para visualizar as probabilidades e apostar.
        </div>
      )}
    </div>
  );
};

export default GamesPage;
