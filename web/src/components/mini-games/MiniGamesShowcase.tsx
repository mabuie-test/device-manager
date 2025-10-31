import clsx from 'clsx';

export interface MiniGame {
  key: string;
  name: string;
  description: string;
  category: string;
  payout_multiplier: number;
  icon?: string;
}

interface MiniGamesShowcaseProps {
  games: MiniGame[];
  onSelect: (game: MiniGame) => void;
  onQuickPlay: (game: MiniGame) => void;
  loadingKey: string | null;
  feedback?: {
    gameKey: string;
    message: string;
    tone: 'success' | 'neutral' | 'error';
  } | null;
}

const MiniGamesShowcase: React.FC<MiniGamesShowcaseProps> = ({
  games,
  onSelect,
  onQuickPlay,
  loadingKey,
  feedback,
}) => {
  const featured = games.slice(0, 6);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/40 p-8 shadow-lg shadow-ocean/10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Mini jogos instantâneos</p>
          <h2 className="text-2xl font-semibold text-slate-100">Jogue em segundos com odds provably fair</h2>
        </div>
        <p className="max-w-sm text-sm text-slate-400">
          Selecionamos os jogos com edge otimizado para garantir rentabilidade e ciclos rápidos. Pode jogar um round
          imediato ou abrir o detalhe completo.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {featured.map((game) => (
          <article
            key={game.key}
            className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-ocean/40 hover:shadow-lg hover:shadow-ocean/10"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{game.icon ?? '🎰'}</span>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{game.name}</h3>
                <p className="text-xs uppercase tracking-wide text-slate-500">{game.category}</p>
              </div>
            </div>
            <p className="mt-4 flex-1 text-sm text-slate-400">{game.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="rounded-full bg-emerald/15 px-3 py-1 text-emerald">
                Retorno médio {game.payout_multiplier.toFixed(2)}x
              </span>
              <button
                type="button"
                onClick={() => onQuickPlay(game)}
                disabled={loadingKey === game.key}
                className={clsx(
                  'rounded-full px-4 py-2 text-xs font-semibold transition',
                  'bg-ocean text-slate-900 hover:bg-ocean/80',
                  loadingKey === game.key && 'cursor-wait opacity-70'
                )}
              >
                {loadingKey === game.key ? 'A jogar…' : 'Jogar agora'}
              </button>
              <button
                type="button"
                onClick={() => onSelect(game)}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-ocean/40 hover:text-ocean"
              >
                Ver detalhes
              </button>
            </div>
            {feedback?.gameKey === game.key && (
              <p
                className={clsx(
                  'mt-4 rounded-xl border px-4 py-3 text-xs',
                  feedback.tone === 'success' && 'border-emerald/40 bg-emerald/10 text-emerald',
                  feedback.tone === 'error' && 'border-rose-400/40 bg-rose-500/10 text-rose-200',
                  feedback.tone === 'neutral' && 'border-ocean/40 bg-ocean/10 text-ocean'
                )}
              >
                {feedback.message}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default MiniGamesShowcase;
