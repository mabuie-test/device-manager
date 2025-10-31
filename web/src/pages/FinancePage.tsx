import { FormEvent, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

const FinancePage = () => {
  const { refreshProfile, profile } = useAuth();
  const [amount, setAmount] = useState(500);
  const [phoneNumber, setPhoneNumber] = useState(profile?.mpesa_number ?? '');
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.mpesa_number) {
      setPhoneNumber(profile.mpesa_number);
    }
  }, [profile?.mpesa_number]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      if (type === 'deposit') {
        await apiClient.post('/finance/deposit', { amount, phoneNumber });
        setFeedback('Pedido de depósito iniciado. Confirme no seu MPesa.');
      } else {
        await apiClient.post('/finance/withdraw', { amount, phoneNumber });
        setFeedback('Pedido de levantamento enviado para aprovação do administrador.');
      }
      await refreshProfile();
    } catch (error) {
      setFeedback((error as Error).message || 'Não foi possível processar a solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr,1fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-8 shadow-lg shadow-ocean/10"
      >
        <h2 className="text-xl font-semibold text-slate-100">Gestão da carteira MPesa</h2>
        <div className="flex gap-4 rounded-full bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => setType('deposit')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              type === 'deposit' ? 'bg-ocean text-slate-900' : 'text-slate-300'
            }`}
          >
            Depositar
          </button>
          <button
            type="button"
            onClick={() => setType('withdraw')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              type === 'withdraw' ? 'bg-emerald text-slate-900' : 'text-slate-300'
            }`}
          >
            Levantar
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Montante (MT)</label>
          <input
            type="number"
            min={50}
            step={50}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/40"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Número MPesa</label>
          <input
            type="tel"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/40"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
          <p className="text-xs text-slate-500">Utilizaremos este número para confirmar as operações C2B.</p>
        </div>
        {feedback && <p className="rounded-2xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald">{feedback}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald/80 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'A processar…' : 'Confirmar'}
        </button>
      </form>

      <aside className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/30 p-8">
        <h3 className="text-lg font-semibold text-slate-100">Regras rápidas</h3>
        <ul className="space-y-3 text-sm text-slate-300">
          <li>• Depósitos instantâneos com confirmação MPesa STK Push.</li>
          <li>• Levantamentos dependem de validação anti-fraude do administrador.</li>
          <li>• Transações ficam registadas com referência única para auditoria.</li>
          <li>• Pode integrar outros métodos de pagamento via API modular.</li>
        </ul>
        <div className="rounded-2xl border border-ocean/30 bg-ocean/10 p-4 text-xs text-ocean">
          Necessita de limites personalizados? Entre em contacto com a equipa de compliance para ajustar limites diários ou
          solicitar relatórios detalhados de transações.
        </div>
      </aside>
    </div>
  );
};

export default FinancePage;
