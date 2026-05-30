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
  onSuccess?: () => void;
}

export default function UpgradeModal({ feature, onClose, onSuccess }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');

  async function handleUnlock(url: string) {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setError('Faça login para continuar.');
        setLoading(false);
        return;
      }

      // Open social media link in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');

      // Immediately update profiles is_premium to true
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Error updating profile to premium:', updateError);
        setError('Erro ao atualizar o perfil. Tente novamente.');
        setLoading(false);
        return;
      }

      // Notify parent component to update state immediately
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      console.error(err);
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
        <div className="px-6 pb-6 space-y-4">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <p className="text-lg font-extrabold text-white leading-snug" style={{ letterSpacing: '-0.02em' }}>
              Acesso restrito a seguidores
            </p>
            <p className="text-xs text-slate-400 mt-1">Para liberar o conteúdo siga a gente nas redes sociais</p>
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          <div className="flex flex-col gap-2.5">
            <button
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2.5"
              style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', boxShadow: '0 4px 15px rgba(220,39,67,0.25)' }}
              onClick={() => handleUnlock('https://www.instagram.com/vivendojuntossp/')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Ativando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Seguir no Instagram
                </>
              )}
            </button>

            <button
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2.5"
              style={{ background: '#010101', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
              onClick={() => handleUnlock('https://www.tiktok.com/@vivendojuntos.sp')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Ativando...
                </>
              ) : (
                <>
                  <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .8.11V9.4a6.27 6.27 0 0 0-3.11.82 6.28 6.28 0 0 0-3.1 5.45 6.3 6.3 0 0 0 10.9 4.35 6.27 6.27 0 0 0 1.68-4.35V8.87a8.37 8.37 0 0 0 5.2 1.8V7.22a4.83 4.83 0 0 1-2.31-.53z"/>
                  </svg>
                  Seguir no TikTok
                </>
              )}
            </button>
          </div>

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
