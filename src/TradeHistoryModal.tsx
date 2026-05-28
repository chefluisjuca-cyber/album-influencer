import React from 'react';
import { X, ArrowLeftRight, CheckCircle2, MessageSquare, Clock, Trophy, Loader2 } from 'lucide-react';
import { supabase } from './supabase';
import type { TradeRequest } from './supabase';

interface TradeWithName extends TradeRequest {
  other_name: string;
}

interface Props {
  userId: string;
  onClose: () => void;
  onOpenChat: (trade: TradeRequest & { other_name: string }) => void;
}

type Tab = 'active' | 'completed';

export default function TradeHistoryModal({ userId, onClose, onOpenChat }: Props) {
  const [trades, setTrades]   = React.useState<TradeWithName[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab]         = React.useState<Tab>('active');

  React.useEffect(() => {
    loadTrades();
  }, [userId]);

  async function loadTrades() {
    setLoading(true);
    const { data } = await supabase
      .from('trade_requests')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    const otherIds = [...new Set((data as TradeRequest[]).map((t) =>
      t.sender_id === userId ? t.receiver_id : t.sender_id
    ))];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,display_name')
      .in('id', otherIds);

    const nameMap: Record<string, string> = {};
    (profiles ?? []).forEach((p: { id: string; display_name: string }) => {
      nameMap[p.id] = p.display_name || 'Colecionador';
    });

    const enriched: TradeWithName[] = (data as TradeRequest[]).map((t) => ({
      ...t,
      other_name: nameMap[t.sender_id === userId ? t.receiver_id : t.sender_id] ?? 'Colecionador',
    }));

    setTrades(enriched);
    setLoading(false);
  }

  const active    = trades.filter((t) => !t.completed_at);
  const completed = trades.filter((t) => !!t.completed_at);
  const visible   = tab === 'active' ? active : completed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #1f0f35 0%, #0c0f20 60%, #03050c 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          boxShadow: '0 20px 50px -10px rgba(139,92,246,0.2)',
          maxHeight: '85vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#1e40af,#0284c7)' }}>
              <ArrowLeftRight size={17} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Minhas Trocas</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-4 shrink-0">
          {(['active', 'completed'] as Tab[]).map((t) => {
            const count = t === 'active' ? active.length : completed.length;
            const label = t === 'active' ? 'Em andamento' : 'Concluídas';
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={tab === t
                  ? { background: 'linear-gradient(135deg,#1e40af,#0284c7)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {t === 'active' ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                {label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-3">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="text-slate-600 animate-spin" />
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="py-10 text-center">
              {tab === 'active'
                ? <>
                    <ArrowLeftRight size={28} className="text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Nenhuma troca em andamento.</p>
                    <p className="text-xs text-slate-700 mt-1">Trocas aceitas aparecem aqui para você combinar os detalhes.</p>
                  </>
                : <>
                    <Trophy size={28} className="text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Nenhuma troca concluída ainda.</p>
                    <p className="text-xs text-slate-700 mt-1">Quando você marcar uma troca como feita, ela aparece aqui.</p>
                  </>
              }
            </div>
          )}

          {visible.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              onOpenChat={() => onOpenChat(trade)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TradeCard({ trade, onOpenChat }: { trade: TradeWithName; onOpenChat: () => void }) {
  const isCompleted = !!trade.completed_at;
  const date        = new Date(isCompleted ? trade.completed_at! : trade.created_at);

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: isCompleted ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.04)',
        border: isCompleted ? '1px solid rgba(16,185,129,0.18)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">{trade.other_name}</p>
            {isCompleted && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                <CheckCircle2 size={9} className="inline mr-1" />concluída
              </span>
            )}
          </div>
          {trade.message && (
            <p className="text-xs text-slate-500 mt-0.5 italic truncate">"{trade.message}"</p>
          )}
          <p className="text-xs text-slate-700 mt-1">
            {isCompleted ? 'Concluída em ' : 'Aceita em '}
            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {!isCompleted && (
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95 shrink-0"
            style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}
          >
            <MessageSquare size={11} /> Chat
          </button>
        )}
      </div>
    </div>
  );
}
