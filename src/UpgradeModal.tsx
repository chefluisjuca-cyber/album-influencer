import React from 'react';
import { X, Crown, MapPin, ArrowLeftRight, BookOpen, Printer, Image, Check, Loader2 } from 'lucide-react';
import { supabase } from './supabase';

const MODAL_BG = {
  background: 'linear-gradient(160deg, #2b1f0c 0%, #0e121e 60%, #05060b 100%)',
  border: '1px solid rgba(245,158,11,0.35)',
  boxShadow: '0 20px 50px -10px rgba(245,158,11,0.3)'
};
const GOLD_GRAD = 'linear-gradient(135deg,#92400e,#f59e0b)';

interface FeatureRow {
  icon: React.ReactNode;
  label: string;
  free: boolean;
  premium: boolean;
}

const FEATURES: FeatureRow[] = [
  { icon: <BookOpen size={14} />,       label: 'Gerenciar álbum completo',    free: true,  premium: true },
  { icon: <Printer size={14} />,        label: 'Imprimir lista de figurinhas', free: true,  premium: true },
  { icon: <Image size={14} />,          label: 'Compartilhar progresso',       free: false, premium: true },
  { icon: <MapPin size={14} />,         label: 'Colecionadores próximos',      free: false, premium: true },
  { icon: <ArrowLeftRight size={14} />, label: 'Trocas e compartilhar',        free: false, premium: true },
];

type FeatureKey = 'nearby' | 'trades' | 'share';

const FEATURE_TITLE: Record<FeatureKey, string> = {
  nearby: 'Colecionadores Próximos',
  trades: 'Trocas e Compartilhar',
  share:  'Compartilhar Progresso',
};

const FEATURE_DESC: Record<FeatureKey, string> = {
  nearby: 'Encontre colecionadores perto de você e combine trocas presencialmente.',
  trades: 'Analise trocas com amigos, compartilhe sua coleção e veja o que cada um pode dar e receber.',
  share:  'Gere um card visual do seu progresso e compartilhe nas redes sociais.',
};

interface Props {
  feature: FeatureKey;
  onClose: () => void;
}

export default function UpgradeModal({ feature, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');

  async function handleCheckout() {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Faça login para continuar.'); setLoading(false); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ origin: window.location.origin }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.url) {
        const msg = json.error ?? `Erro ${res.status} ao iniciar pagamento.`;
        setError(msg);
        console.error('Checkout error:', res.status, JSON.stringify(json));
        setLoading(false);
        return;
      }

      window.location.href = json.url;
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
    >
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={MODAL_BG}>

        {/* Header dourado */}
        <div
          className="relative px-6 pt-7 pb-6 text-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg,rgba(146,64,14,0.25),rgba(245,158,11,0.08))' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(245,158,11,0.15),transparent)' }} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 relative"
            style={{ background: GOLD_GRAD, boxShadow: '0 0 30px rgba(245,158,11,0.35)' }}
          >
            <Crown size={26} className="text-white" />
          </div>

          <h2 className="text-xl font-extrabold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
            Recurso Premium
          </h2>
          <p className="text-sm text-amber-300/80 font-semibold">{FEATURE_TITLE[feature]}</p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
            {FEATURE_DESC[feature]}
          </p>
        </div>

        {/* Comparativo */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-1 mb-3">
            <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest col-span-1" />
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest text-center">Grátis</div>
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest text-center">Premium</div>
          </div>

          <div className="space-y-1">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="grid grid-cols-3 gap-1 items-center px-3 py-2.5 rounded-xl transition-colors"
                style={!f.free && f.premium ? { background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' } : { background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-2 col-span-1">
                  <span className="text-slate-500">{f.icon}</span>
                  <span className="text-xs text-slate-400 leading-tight">{f.label}</span>
                </div>
                <div className="flex justify-center">
                  {f.free
                    ? <Check size={14} className="text-emerald-400" />
                    : <span className="w-3.5 h-0.5 rounded-full bg-slate-700 block" />
                  }
                </div>
                <div className="flex justify-center">
                  {f.premium
                    ? <Check size={14} className="text-amber-400" />
                    : <span className="w-3.5 h-0.5 rounded-full bg-slate-700 block" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <p className="text-2xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>
              R$ 13,99<span className="text-sm font-normal text-slate-500">/mês</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Cancele quando quiser</p>
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          <button
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            style={{ background: GOLD_GRAD, boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> Aguarde...</span>
              : <span className="flex items-center justify-center gap-2"><Crown size={15} /> Assinar Premium — R$ 13,99/mês</span>
            }
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl text-xs font-medium text-slate-600 hover:text-slate-400 transition-colors"
          >
            Continuar com o plano grátis
          </button>
        </div>
      </div>
    </div>
  );
}
