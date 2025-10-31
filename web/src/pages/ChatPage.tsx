import { FormEvent, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

interface ChatMessage {
  id: string;
  author: string;
  message: string;
  created_at: string;
}

const ChatPage = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const response = await apiClient.get('/chat/history');
      setMessages(response.data.messages);
    };
    void fetchHistory();

    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;

    socket.on('history', (history: ChatMessage[]) => setMessages(history));
    socket.on('message', (message: ChatMessage) => setMessages((prev) => [...prev, message]));
    socket.on('typing', (author: string) => {
      setTyping(author);
      setTimeout(() => setTyping(null), 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('message', {
      author: profile?.email ?? 'Convidado',
      message: input,
      userId: profile?.id,
    });
    setInput('');
  };

  const handleTyping = () => {
    socketRef.current?.emit('typing', profile?.email ?? 'Convidado');
  };

  return (
    <div className="grid h-[70vh] gap-6 md:grid-cols-[2fr,1fr]">
      <div className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/40">
        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {messages.map((message) => (
            <div key={message.id} className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-200">{message.author}</span>
                <span>{new Date(message.created_at).toLocaleTimeString('pt-PT')}</span>
              </div>
              <p className="mt-2 text-sm text-slate-100">{message.message}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleTyping}
              placeholder="Partilhe estratégias, suporte ou resultados!"
              className="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/40"
            />
            <button
              type="submit"
              className="rounded-full bg-ocean px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-ocean/80"
            >
              Enviar
            </button>
          </div>
          {typing && <p className="mt-2 text-xs text-slate-400">{typing} está a escrever…</p>}
        </form>
      </div>
      <aside className="rounded-3xl border border-white/10 bg-slate-900/30 p-6 text-sm text-slate-300">
        <h3 className="text-lg font-semibold text-slate-100">Regras da comunidade</h3>
        <ul className="mt-4 space-y-3">
          <li>• Utilize linguagem respeitosa e evite partilhar dados pessoais.</li>
          <li>• A equipa de suporte pode intervir a qualquer momento para garantir a conformidade.</li>
          <li>• Partilhe resultados com seeds e nonces para auditoria transparente.</li>
          <li>• Canal preparado para transmissão futura de streaming e voice-chat.</li>
        </ul>
      </aside>
    </div>
  );
};

export default ChatPage;
