import { Link } from 'react-router-dom';
import FeatureCard from '../components/sections/FeatureCard';

const features = [
  {
    title: 'Provably Fair 1/4',
    description: 'Cada jogo é auditável com seeds públicos e HMACs para garantir probabilidades honestas.',
    icon: '🔐',
  },
  {
    title: 'Integração MPesa',
    description: 'Depósitos e levantamentos integrados com MPesa Moçambique via fluxo C2B seguro.',
    icon: '📲',
  },
  {
    title: 'Controlo Total',
    description: 'Painel administrativo completo com gestão de utilizadores, limites e partidas de futebol.',
    icon: '🛠️',
  },
  {
    title: 'Streaming e Chat',
    description: 'Salas de chat em tempo real e infraestrutura escalável pronta para streaming e novas integrações.',
    icon: '💬',
  },
];

const LandingPage = () => {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl bg-slate-900/50 p-10 shadow-2xl shadow-ocean/10 md:grid-cols-[1.2fr,1fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald/20 px-4 py-1 text-sm font-semibold text-emerald">
            Regulamentado · Transparente · Seguro
          </span>
          <h1 className="text-4xl font-bold leading-tight text-slate-50 md:text-5xl">
            A plataforma de apostas que prioriza confiança e compliance em Moçambique.
          </h1>
          <p className="text-lg text-slate-300">
            FluxoBet combina jogos de probabilidade 1/4 comprovadamente justos, integração MPesa e um painel administrativo
            robusto. Seja para gerir operações ou jogar com segurança, a experiência é fluída em todos os dispositivos.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="rounded-full bg-ocean px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-ocean/80"
            >
              Começar agora
            </Link>
            <Link to="/games" className="text-sm font-semibold text-slate-200 hover:text-emerald">
              Explorar jogos →
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-ocean/30 via-emerald/10 to-transparent p-6">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Painel em tempo real</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">Volume diário</p>
                <p className="text-2xl font-semibold text-emerald">1 245 500 MT</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-400">Jogadores ativos</p>
                  <p className="text-xl font-semibold text-slate-100">2 418</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-400">Taxa de aprovação</p>
                  <p className="text-xl font-semibold text-ocean">98%</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">Tempo médio de levantamento</p>
                <p className="text-xl font-semibold text-amber">12 minutos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-10">
        <h2 className="text-3xl font-semibold text-slate-100">Compliance e auditoria contínua</h2>
        <p className="mt-4 max-w-3xl text-slate-300">
          Todo o motor foi desenhado para operar com padrões internacionais de jogos online: histórico detalhado,
          exportação de relatórios, auditorias independentes e camadas adicionais de verificação KYC/KYB. A arquitectura
          modular permite adicionar provedores certificados rapidamente.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="text-lg font-semibold text-emerald">Auditorias automatizadas</h3>
            <p className="mt-2 text-sm text-slate-300">Validação de seeds, logs invioláveis e alertas de integridade.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="text-lg font-semibold text-amber">Gestão de risco</h3>
            <p className="mt-2 text-sm text-slate-300">Limites personalizáveis, bloqueios preventivos e gestão de limites.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="text-lg font-semibold text-ocean">Integrações extensíveis</h3>
            <p className="mt-2 text-sm text-slate-300">API modular pronta para novos jogos e provedores de pagamentos.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
