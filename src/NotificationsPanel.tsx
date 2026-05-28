import React from 'react';
import { X, Bell, ArrowLeftRight, CheckCircle2, XCircle, Loader2, MessageSquare } from 'lucide-react';
import {
  supabase,
  loadNotifications,
  markNotificationsRead,
  respondToTradeRequest,
  type AppNotification,
  type TradeRequest,
} from './supabase';

interface Props {
  userId: string;
  onClose: () => void;
  onOpenChat: (trade: TradeRequest & { other_name: string }) => void;
}

export default function NotificationsPanel({ userId, onClose, onOpenChat }: Props) {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [loading, setLoading]             = React.useState(true);
  const [responding, setResponding]       = React.useState<string | null>(null);

  React.useEffect(() => {
    loadNotifications(userId).then((ns) => {
      setNotifications(ns);
      setLoading(false);
      const unread = ns.filter((n) => !n.read).map((n) => n.id);
      if (unread.length) markNotificationsRead(unread);
    });

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as AppNotification, ...prev]);
          markNotificationsRead([payload.new.id]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function handleRespond(notification: AppNotification, status: 'accepted' | 'declined') {
    const tradeId = notification.payload.trade_request_id;
    if (!tradeId) return;
    setResponding(notification.id);
    await respondToTradeRequest(tradeId, status);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id
          ? { ...n, payload: { ...n.payload, _responded: status } as AppNotification['payload'] & { _responded?: string } }
          : n
      )
    );
    setResponding(null);

    if (status === 'accepted') {
      const senderName = notification.payload.sender_name || 'Colecionador';
      const trade: TradeRequest & { other_name: string } = {
        id: tradeId,
        sender_id: notification.payload.sender_id ?? '',
        receiver_id: userId,
        status: 'accepted',
        message: notification.payload.message ?? '',
        created_at: notification.created_at,
        completed_at: null,
        other_name: senderName,
      };
      onClose();
      onOpenChat(trade);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #241a0b 0%, #0d0f1b 60%, #04050a 100%)',
          border: '1px solid rgba(245,158,11,0.3)',
          boxShadow: '0 20px 50px -10px rgba(245,158,11,0.2)',
          maxHeight: '85vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#b45309,#f59e0b)' }}>
              <Bell size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Notificações</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-3">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-slate-600 animate-spin" />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="py-10 text-center">
              <Bell size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhuma notificação ainda.</p>
              <p className="text-xs text-slate-700 mt-1">Quando alguém te enviar uma proposta de troca, ela aparecerá aqui.</p>
            </div>
          )}

          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              responding={responding === n.id}
              onRespond={(status) => handleRespond(n, status)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationCard({
  notification: n,
  responding,
  onRespond,
}: {
  notification: AppNotification & { payload: AppNotification['payload'] & { _responded?: string } };
  responding: boolean;
  onRespond: (s: 'accepted' | 'declined') => void;
}) {
  const isTradeRequest = n.type === 'trade_request';
  const responded      = (n.payload as { _responded?: string })._responded;

  return (
    <div
      className="rounded-2xl p-4 space-y-3 transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background:
              n.type === 'trade_request'  ? 'rgba(14,165,233,0.15)' :
              n.type === 'trade_accepted' ? 'rgba(16,185,129,0.15)' :
              'rgba(244,63,94,0.1)',
          }}
        >
          <ArrowLeftRight
            size={14}
            className={
              n.type === 'trade_request'  ? 'text-sky-400' :
              n.type === 'trade_accepted' ? 'text-emerald-400' :
              'text-rose-400'
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug">
            {n.type === 'trade_request' && (
              <><span className="text-sky-300">{n.payload.sender_name || 'Alguém'}</span> quer trocar figurinhas com você!</>
            )}
            {n.type === 'trade_accepted' && (
              <><span className="text-emerald-300">{n.payload.receiver_name || 'Alguém'}</span> aceitou sua proposta de troca!</>
            )}
            {n.type === 'trade_declined' && (
              <><span className="text-rose-300">{n.payload.receiver_name || 'Alguém'}</span> recusou sua proposta de troca.</>
            )}
          </p>
          {n.payload.message && (
            <p className="text-xs text-slate-400 mt-1 italic">"{n.payload.message}"</p>
          )}
          <p className="text-xs text-slate-600 mt-1">{formatRelativeTime(n.created_at)}</p>
        </div>
      </div>

      {isTradeRequest && !responded && (
        <div className="flex gap-2">
          <button
            onClick={() => onRespond('accepted')}
            disabled={responding}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100"
            style={{ background: 'linear-gradient(135deg,#065f46,#10b981)' }}
          >
            {responding ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Aceitar
          </button>
          <button
            onClick={() => onRespond('declined')}
            disabled={responding}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100"
            style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <XCircle size={12} /> Recusar
          </button>
        </div>
      )}

      {isTradeRequest && responded === 'accepted' && (
        <div className="rounded-xl px-3 py-2 text-xs font-semibold text-emerald-400 flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <MessageSquare size={12} /> Troca aceita! Abrindo chat para combinar os detalhes...
        </div>
      )}

      {isTradeRequest && responded === 'declined' && (
        <div className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <XCircle size={12} /> Proposta recusada.
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'Agora mesmo';
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d} dia${d !== 1 ? 's' : ''} atrás`;
}
