import { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { Link } from 'react-router-dom';

interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
  reference: string;
  channel: string;
  metadata: string | null;
  created_at: string;
}

interface MetadataShape {
  mpesa?: {
    status?: string;
    displayPhone?: string;
    msisdn?: string;
    merchantRequestId?: string;
    checkoutRequestId?: string;
    customerMessage?: string;
    conversationId?: string;
    responseDescription?: string;
    resultDescription?: string;
  };
  [key: string]: unknown;
}

const WithdrawalApprovalsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ transactions: Transaction[] }>('/finance/admin/transactions');
      setTransactions(response.data.transactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTransactions();
  }, []);

  const parseMetadata = (metadata: string | null): MetadataShape => {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata) as MetadataShape;
    } catch (error) {
      console.warn('Não foi possível analisar metadados MPesa', error);
      return {};
    }
  };

  const pendingWithdrawals = transactions
    .filter((tx) => tx.type === 'withdrawal')
    .map((tx) => ({ ...tx, meta: parseMetadata(tx.metadata) }))
    .filter((tx) => tx.status === 'pending' || tx.meta.mpesa?.status === 'processing');

  const handleApprove = async (transactionId: string) => {
    setProcessingId(transactionId);
    setFeedback(null);
    try {
      const response = await apiClient.post<{ message: string }>(
        `/finance/admin/withdrawals/${transactionId}/approve`,
        {}
      );
      setFeedback(response.data.message);
      await fetchTransactions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao contactar o MPesa.';
      setFeedback(message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">MPesa · Supervisão</p>
          <h1 className="text-3xl font-semibold text-slate-100">Aprovação de levantamentos</h1>
        </div>
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => void fetchTransactions()}
            className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-ocean/40 hover:text-ocean"
          >
            Atualizar lista
          </button>
          <Link
            to="/admin"
            className="rounded-full bg-ocean px-4 py-2 font-semibold text-slate-900 transition hover:bg-ocean/80"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="rounded-3xl border border-emerald/30 bg-emerald/10 p-4 text-sm text-emerald">{feedback}</div>
      )}

      {loading ? (
        <p className="text-slate-400">A carregar solicitações pendentes…</p>
      ) : pendingWithdrawals.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">
          Nenhum levantamento aguarda aprovação no momento.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/40">
          <table className="w-full min-w-[720px] text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Referência</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Mensagem MPesa</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingWithdrawals.map((tx) => (
                <tr key={tx.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-semibold text-slate-100">{tx.reference}</td>
                  <td className="px-4 py-3 text-emerald">{tx.amount.toFixed(2)} MT</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-ocean/10 px-3 py-1 text-xs text-ocean">
                      {tx.meta.mpesa?.status ?? tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {tx.meta.mpesa?.displayPhone ?? tx.meta.mpesa?.msisdn ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {tx.meta.mpesa?.responseDescription ?? tx.meta.mpesa?.customerMessage ?? 'Aguardando submissão'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleApprove(tx.id)}
                      disabled={processingId === tx.id}
                      className="rounded-full bg-emerald px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processingId === tx.id ? 'A enviar…' : 'Aprovar e pagar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WithdrawalApprovalsPage;
