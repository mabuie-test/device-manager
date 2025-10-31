import { FormEvent, useState } from 'react';
import { apiClient } from '../services/apiClient';

const RecoverPage = () => {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      await apiClient.post('/auth/request-password-reset', { email });
      setFeedback('Se o e-mail existir, enviaremos instruções em instantes.');
    } catch (error) {
      setFeedback((error as Error).message || 'Não foi possível processar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-slate-900/50 p-10">
      <h1 className="text-2xl font-semibold text-slate-100">Recuperar palavra-passe</h1>
      <p className="mt-2 text-sm text-slate-400">
        Informe o seu e-mail registado para receber um token de recuperação. O processo expira em 30 minutos.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-300">E-mail</label>
          <input
            type="email"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/40"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {feedback && <p className="rounded-2xl border border-ocean/30 bg-ocean/10 px-4 py-3 text-sm text-ocean">{feedback}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ocean px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-ocean/80 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'A enviar…' : 'Enviar instruções'}
        </button>
      </form>
    </div>
  );
};

export default RecoverPage;
