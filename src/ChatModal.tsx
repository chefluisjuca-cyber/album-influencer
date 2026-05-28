import React from 'react';
import { X, MessageSquare, Send, Loader2, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { supabase } from './supabase';
import type { TradeRequest } from './supabase';

interface ChatMessage {
  id: string;
  trade_request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Props {
  userId: string;
  trade: TradeRequest & { other_name: string };
  onClose: () => void;
  onMarkComplete: (tradeId: string) => void;
}

export default function ChatModal({ userId, trade, onClose, onMarkComplete }: Props) {
  const [messages, setMessages]   = React.useState<ChatMessage[]>([]);
  const [loading, setLoading]     = React.useState(true);
  const [input, setInput]         = React.useState('');
  const [sending, setSending]     = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const bottomRef                 = React.useRef<HTMLDivElement>(null);
  const inputRef                  = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('trade_request_id', trade.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as ChatMessage[]);
        setLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });

    const channel = supabase
      .channel(`chat:${trade.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `trade_request_id=eq.${trade.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [trade.id]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    await supabase
      .from('chat_messages')
      .insert({ trade_request_id: trade.id, sender_id: userId, content });
    setSending(false);
    inputRef.current?.focus();
  }

  async function handleComplete() {
    setCompleting(true);
    await supabase
      .from('trade_requests')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', trade.id);
    onMarkComplete(trade.id);
    setCompleting(false);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isCompleted = !!trade.completed_at;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #071f21 0%, #07121d 60%, #030811 100%)',
          border: '1px solid rgba(20,184,166,0.3)',
          boxShadow: '0 20px 50px -10px rgba(20,184,166,0.25)',
          maxHeight: '90vh',
          height: '90vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
              <MessageSquare size={17} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{trade.other_name}</p>
              <div className="flex items-center gap-1.5">
                <ArrowLeftRight size={10} className="text-teal-500" />
                <p className="text-xs text-teal-500 font-medium">
                  {isCompleted ? 'Troca concluída' : 'Combinando a troca'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#065f46,#10b981)' }}
              >
                {completing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                Concluir troca
              </button>
            )}
            {isCompleted && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                <CheckCircle2 size={11} /> Concluída
              </span>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="text-slate-600 animate-spin" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="py-10 text-center">
              <MessageSquare size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma mensagem ainda.</p>
              <p className="text-xs text-slate-700 mt-1">Combine os detalhes da troca aqui.</p>
            </div>
          )}

          {messages.map((msg) => {
            const mine = msg.sender_id === userId;
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] rounded-2xl px-3.5 py-2.5"
                  style={mine
                    ? { background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <p className="text-sm leading-snug">{msg.content}</p>
                  <p className="text-[10px] mt-1 opacity-60">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!isCompleted && (
          <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mensagem..."
                maxLength={500}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}
              >
                {sending ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} className="text-white" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
