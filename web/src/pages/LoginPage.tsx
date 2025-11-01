import { FormEvent, useState } from 'react';
import axios from 'axios';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return <div className="py-10 text-center text-slate-300">A validar a sua sessão…</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const redirectTo = (location.state as { from?: string })?.from ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: string } | undefined)?.message;
        setError(message ?? 'Falha ao autenticar. Verifique as suas credenciais ou a configuração da API.');
      } else {
        setError((err as Error).message || 'Falha ao autenticar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-slate-900/50 p-10 shadow-2xl shadow-ocean/10">
      <h1 className="text-3xl font-semibold text-slate-100">Bem-vindo de volta</h1>
      <p className="mt-2 text-sm text-slate-400">
        Entre com as suas credenciais para aceder ao painel e aos jogos provably fair.
      </p>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/50"
            placeholder="usuario@fluxobet.co.mz"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300" htmlFor="password">
            Palavra-passe
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/50"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ocean px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-ocean/80 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'A validar…' : 'Entrar'}
        </button>
      </form>
      <div className="mt-6 flex justify-between text-sm text-slate-400">
        <Link to="/register" className="text-ocean hover:text-emerald">
          Criar nova conta
        </Link>
        <Link to="/recover" className="text-slate-300 hover:text-ocean">
          Recuperar palavra-passe
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
