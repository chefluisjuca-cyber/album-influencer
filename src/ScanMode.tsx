import React from 'react';
import { X, Zap, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SECTIONS } from './data';
import type { CollectionMap } from './supabase';

interface Props {
  collection: CollectionMap;
  onSticker: (sectionCode: string, stickerId: string) => void;
  onRemove: (sectionCode: string, stickerId: string) => void;
  onClose: () => void;
}

export default function ScanMode({ collection, onSticker, onRemove, onClose }: Props) {
  const [sectionIdx, setSectionIdx] = React.useState(0);
  const [lastAdded, setLastAdded]   = React.useState<string | null>(null);
  const [addCount, setAddCount]     = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const section = SECTIONS[sectionIdx];
  const secColl = collection[section.code] || {};

  function handleTap(stickerId: string) {
    onSticker(section.code, stickerId);
    setLastAdded(stickerId);
    setAddCount((c) => c + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLastAdded(null), 800);
  }

  function handleRemove(stickerId: string) {
    onRemove(section.code, stickerId);
  }

  function prevSection() { setSectionIdx((i) => Math.max(0, i - 1)); }
  function nextSection() { setSectionIdx((i) => Math.min(SECTIONS.length - 1, i + 1)); }

  const glued    = section.stickers.filter((s) => (secColl[s] ?? 0) === 1).length;
  const repeated = section.stickers.filter((s) => (secColl[s] ?? 0) > 1).length;
  const missing  = section.stickers.length - glued - repeated;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#050d1a' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,13,26,0.95)', backdropFilter: 'blur(8px)' }}
      >
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
          <X size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
            <Zap size={14} className="text-amber-900" />
          </div>
          <span className="text-sm font-bold text-white">Adicione rapidamente</span>
        </div>
        <div className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
          +{addCount}
        </div>
      </div>

      {/* Section navigator */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={prevSection}
          disabled={sectionIdx === 0}
          className="p-2 rounded-xl transition-all hover:bg-white/10 disabled:opacity-30 text-slate-400 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs text-slate-600 font-mono uppercase tracking-widest">{section.code}</p>
          <p className="text-base font-bold text-white">{section.name}</p>
          <p className="text-xs text-slate-600 mt-0.5">{sectionIdx + 1} / {SECTIONS.length}</p>
        </div>
        <button
          onClick={nextSection}
          disabled={sectionIdx === SECTIONS.length - 1}
          className="p-2 rounded-xl transition-all hover:bg-white/10 disabled:opacity-30 text-slate-400 hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Mini stats */}
      <div className="flex gap-2 px-4 pt-2.5 pb-1 shrink-0">
        <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
          {glued} coladas
        </span>
        <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
          {repeated} repetidas
        </span>
        <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: '#475569' }}>
          {missing} faltando
        </span>
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-slate-700 px-4 pt-1 pb-2 shrink-0">
        Toque no número para adicionar · "rem" para remover
      </p>

      {/* Sticker grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {section.stickers.map((stickerId) => {
            const count  = secColl[stickerId] ?? 0;
            const isLast = lastAdded === stickerId;
            const rep    = count > 1;
            const glued  = count === 1;

            let bg        = 'rgba(255,255,255,0.04)';
            let border    = 'rgba(255,255,255,0.07)';
            let textColor = '#334155';
            if (isLast)      { bg = 'rgba(251,191,36,0.25)'; border = 'rgba(251,191,36,0.5)';  textColor = '#fde68a'; }
            else if (rep)    { bg = 'rgba(251,191,36,0.08)'; border = 'rgba(251,191,36,0.3)';  textColor = '#fbbf24'; }
            else if (glued)  { bg = 'rgba(16,185,129,0.09)'; border = 'rgba(16,185,129,0.3)';  textColor = '#34d399'; }

            return (
              <div
                key={stickerId}
                className="relative rounded-xl border flex flex-col overflow-hidden transition-all select-none"
                style={{ background: bg, borderColor: border }}
              >
                {/* Add button */}
                <button
                  onClick={() => handleTap(stickerId)}
                  className="flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-1.5 px-1 active:scale-90 transition-transform w-full"
                >
                  <span className="text-[11px] font-bold font-mono leading-none" style={{ color: textColor }}>
                    {stickerId.replace(section.code, '') || stickerId}
                  </span>
                  {count > 0 ? (
                    <span className="text-[9px] font-bold leading-none" style={{ color: rep ? '#f59e0b' : '#10b981' }}>
                      {rep ? `×${count}` : '✓'}
                    </span>
                  ) : (
                    <span className="text-[9px] leading-none text-emerald-700 font-bold">+ add</span>
                  )}
                </button>

                {/* Remove button — visible only when count > 0 */}
                {count > 0 && (
                  <button
                    onClick={() => handleRemove(stickerId)}
                    className="w-full flex items-center justify-center py-1 text-[9px] font-bold transition-colors hover:bg-rose-500/20 active:scale-95"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#f43f5e' }}
                  >
                    − rem
                  </button>
                )}

                {isLast && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center pointer-events-none" style={{ background: '#fbbf24' }}>
                    <CheckCircle2 size={10} className="text-amber-900" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="shrink-0 px-4 py-3 flex items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,13,26,0.95)', backdropFilter: 'blur(8px)' }}
      >
        <button
          onClick={prevSection}
          disabled={sectionIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <div className="flex-1 text-center text-xs text-slate-700">
          {section.stickers.length} figurinhas
        </div>
        {sectionIdx < SECTIONS.length - 1 ? (
          <button
            onClick={nextSection}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}
          >
            Próxima <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#065f46,#10b981)' }}
          >
            <CheckCircle2 size={14} /> Concluir
          </button>
        )}
      </div>
    </div>
  );
}
