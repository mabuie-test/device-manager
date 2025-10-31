import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const navLinks = [
  { to: '/', label: 'Início', private: false },
  { to: '/games', label: 'Jogos', private: true },
  { to: '/finance', label: 'Carteira', private: true },
  { to: '/chat', label: 'Chat', private: true },
];

const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout, profile, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span className="rounded-full bg-ocean/20 px-3 py-1 text-ocean">BetPulse</span>
            <span className="text-sm text-slate-400">Provably Fair</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {navLinks
              .filter((link) => (link.private ? isAuthenticated : true))
              .map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx('transition-colors hover:text-emerald', {
                    'text-emerald': location.pathname.startsWith(link.to) && link.to !== '/',
                    'text-slate-300': !location.pathname.startsWith(link.to) || link.to === '/',
                  })}
                >
                  {link.label}
                </Link>
              ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={clsx('transition-colors hover:text-amber', {
                  'text-amber': location.pathname.startsWith('/admin'),
                  'text-slate-300': !location.pathname.startsWith('/admin'),
                })}
              >
                Painel Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {isAuthenticated ? (
              <>
                <div className="text-right">
                  <p className="font-semibold text-slate-100">{profile?.email}</p>
                  <p className="text-xs text-slate-400">Saldo: {profile?.balance?.toFixed(2)} MT</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald/80"
                >
                  Terminar sessão
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full border border-ocean px-4 py-2 text-ocean transition hover:bg-ocean/10"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-ocean px-4 py-2 font-semibold text-slate-900 transition hover:bg-ocean/80"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">{children}</div>
      </main>
      <footer className="border-t border-white/5 bg-slate-950/60 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} BetPulse. Operação licenciada com segurança e transparência.
      </footer>
    </div>
  );
};

export default ShellLayout;
