import { FormEvent, useState } from 'react';
import axios from 'axios';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    phone: '',
    age: 18,
    mpesaNumber: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return <div className="py-10 text-center text-slate-300">A validar a sua sessão…</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        phone: form.phone,
        age: Number(form.age),
        mpesaNumber: form.mpesaNumber,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: string } | undefined)?.message;
        setError(message ?? 'Falha ao registar. Verifique os dados introduzidos e a disponibilidade da API.');
      } else {
        setError((err as Error).message || 'Falha ao registar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-slate-900/50 p-10 shadow-2xl shadow-emerald/10">
      <h1 className="text-3xl font-semibold text-slate-100">Criar conta FluxoBet</h1>
      <p className="mt-2 text-sm text-slate-400">
        Registe-se com os seus dados reais. Utilizaremos o e-mail para recuperação de palavra-passe e o seu número MPesa
        para pagamentos C2B.
      </p>
      <form className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-300" htmlFor="email">
            E-mail profissional
          </label>
          <input
            id="email"
            type="email"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/40"
            placeholder="usuario@empresa.co.mz"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300" htmlFor="password">
            Palavra-passe segura
          </label>
          <input
            id="password"
            type="password"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/40"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300" htmlFor="age">
            Idade
          </label>
          <input
            id="age"
            type="number"
            min={18}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/40"
            value={form.age}
            onChange={(event) => updateField('age', event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300" htmlFor="phone">
            Número de telemóvel
          </label>
          <input
            id="phone"
            type="tel"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/40"
            placeholder="+25884XXXXXXX"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300" htmlFor="mpesaNumber">
            Número MPesa C2B
          </label>
          <input
            id="mpesaNumber"
            type="tel"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/40"
            placeholder="Número que receberá pagamentos"
            value={form.mpesaNumber}
            onChange={(event) => updateField('mpesaNumber', event.target.value)}
            required
          />
        </div>
        {error && (
          <p className="md:col-span-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
        )}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald/80 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'A validar…' : 'Criar conta' }
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Já possui conta?{' '}
        <Link to="/login" className="text-emerald hover:text-ocean">
          Faça login
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
