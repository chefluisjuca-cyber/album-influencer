import React from 'react';
import { X, Share2, Copy, Download, Image } from 'lucide-react';
import { SECTIONS, TOTAL_STICKERS } from './data';
import type { CollectionMap } from './supabase';

interface Props {
  collection: CollectionMap;
  displayName: string;
  onClose: () => void;
  showToast: (msg: string, warn?: boolean) => void;
}

function computeStats(collection: CollectionMap) {
  let glued = 0, repeated = 0, missing = 0;
  for (const sec of SECTIONS) {
    for (const s of sec.stickers) {
      const c = collection[sec.code]?.[s] ?? 0;
      if (c === 0) missing++;
      else { glued++; if (c > 1) repeated += c - 1; }
    }
  }
  return { glued, repeated, missing, pct: Math.round((glued / TOTAL_STICKERS) * 100) };
}

// Returns a list of sections with per-section completion %
function sectionProgress(collection: CollectionMap) {
  return SECTIONS.map((sec) => {
    const glued = sec.stickers.filter((s) => (collection[sec.code]?.[s] ?? 0) >= 1).length;
    return { code: sec.code, name: sec.name, type: sec.type, total: sec.stickers.length, glued };
  });
}

export default function ShareProgressModal({ collection, displayName, onClose, showToast }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = React.useState(false);
  const { glued, repeated, missing, pct } = computeStats(collection);
  const sections = sectionProgress(collection);
  const topSecs = [...sections].sort((a, b) => b.glued / b.total - a.glued / a.total).slice(0, 8);

  const renderCard = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 800, H = 420;
    canvas.width  = W;
    canvas.height = H;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   '#030810');
    bg.addColorStop(0.5, '#071224');
    bg.addColorStop(1,   '#030810');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Glow circle top-right
    const glow = ctx.createRadialGradient(W - 80, 80, 0, W - 80, 80, 220);
    glow.addColorStop(0, 'rgba(2,132,199,0.18)');
    glow.addColorStop(1, 'rgba(2,132,199,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Left glow
    const glow2 = ctx.createRadialGradient(80, H - 80, 0, 80, H - 80, 180);
    glow2.addColorStop(0, 'rgba(15,118,110,0.15)');
    glow2.addColorStop(1, 'rgba(15,118,110,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, 0, 0, W, H, 24);
    ctx.stroke();

    // App label
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(100,116,139,0.8)';
    ctx.fillText('ÁLBUM COPA 2026', 40, 44);

    // Trophy icon area (simulated with circle)
    ctx.beginPath();
    ctx.arc(46, 80, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2,132,199,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(2,132,199,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '22px system-ui';
    ctx.fillText('🏆', 33, 90);

    // User name
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(truncate(displayName || 'Colecionador', 22), 80, 90);

    // Big percentage
    const pctGrad = ctx.createLinearGradient(40, 110, 240, 160);
    pctGrad.addColorStop(0, '#38bdf8');
    pctGrad.addColorStop(1, '#818cf8');
    ctx.font = 'bold 88px system-ui, sans-serif';
    ctx.fillStyle = pctGrad;
    ctx.fillText(`${pct}%`, 40, 190);

    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.fillText('do álbum completo', 42, 215);

    // Stats row
    const stats = [
      { label: 'coladas',   value: glued,    color: '#10b981' },
      { label: 'repetidas', value: repeated,  color: '#f59e0b' },
      { label: 'faltando',  value: missing,   color: '#f43f5e' },
    ];
    stats.forEach((s, i) => {
      const x = 40 + i * 140;
      const y = 255;
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillStyle = s.color;
      ctx.fillText(String(s.value), x, y);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(100,116,139,0.8)';
      ctx.fillText(s.label, x, y + 16);
    });

    // Progress bar
    const barX = 40, barY = 295, barW = 460, barH = 8;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRectFill(ctx, barX, barY, barW, barH, 4);
    ctx.fillStyle = '#ffffff';
    roundRectFill(ctx, barX, barY, barW * (pct / 100), barH, 4);

    // Section mini-bars (right side)
    const colX     = 530, startY = 60, rowH = 42;
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.fillText('DESTAQUES', colX, startY - 10);

    topSecs.forEach((s, i) => {
      const y      = startY + i * rowH;
      const bW     = 220;
      const bH     = 5;
      const filled = (s.glued / s.total) * bW;
      const sPct   = Math.round((s.glued / s.total) * 100);

      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(226,232,240,0.85)';
      ctx.fillText(truncate(s.name, 18), colX, y + 3);

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRectFill(ctx, colX, y + 9, bW, bH, 3);

      const secColor = s.type === 'special' ? '#f59e0b' : s.type === 'sponsor' ? '#60a5fa' : '#34d399';
      ctx.fillStyle = secColor;
      roundRectFill(ctx, colX, y + 9, filled, bH, 3);

      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(100,116,139,0.7)';
      ctx.fillText(`${sPct}%`, colX + bW + 6, y + 14);
    });

    // Bottom watermark
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(71,85,105,0.7)';
    ctx.fillText('albumcopa2026.app', 40, H - 22);
    ctx.fillText(new Date().toLocaleDateString('pt-BR'), W - 110, H - 22);

    setRendered(true);
  }, [displayName, glued, repeated, missing, pct, topSecs]);

  React.useEffect(() => {
    renderCard();
  }, [renderCard]);

  function copyImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).then(
        () => showToast('Imagem copiada!'),
        () => showToast('Não foi possível copiar.', true),
      );
    });
  }

  function downloadImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'progresso-album-copa2026.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('Imagem baixada!');
  }

  async function shareNative() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'progresso-album-copa2026.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Meu progresso no Álbum Copa 2026' });
        } catch { /* user cancelled */ }
      } else {
        downloadImage();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #0f242b 0%, #091522 60%, #030811 100%)',
          border: '1px solid rgba(20,184,166,0.3)',
          boxShadow: '0 20px 50px -10px rgba(20,184,166,0.25)',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
              <Image size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Compartilhar progresso</h2>
              <p className="text-xs text-slate-500">Card visual para redes sociais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-4">
          {/* Card HTML Preview */}
          <div 
            className="relative rounded-2xl p-5 overflow-hidden border border-white/10 bg-gradient-to-br from-[#030810] via-[#071224] to-[#030810] shadow-xl"
          >
            {/* Ambient glows */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Grid background effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50" />

            <div className="relative z-10 space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold tracking-widest text-slate-500/80">ÁLBUM COPA 2026</span>
                  <div className="flex items-center gap-2.5 mt-2">
                    <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-base shrink-0">
                      🏆
                    </div>
                    <span className="text-lg font-bold text-white truncate max-w-[160px] md:max-w-[200px]">
                      {displayName || 'Colecionador'}
                    </span>
                  </div>
                </div>
                
                {/* Large Percentage */}
                <div className="text-right shrink-0">
                  <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 leading-none">
                    {pct}%
                  </div>
                  <span className="block text-[10px] text-slate-400/80 mt-1 font-medium">completado</span>
                </div>
              </div>

              {/* Progress bar and stats in one cohesive section */}
              <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                {/* General Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>PROGRESSO GERAL</span>
                    <span>{glued} / {TOTAL_STICKERS}</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-white transition-all duration-700" 
                      style={{ width: `${pct}%`, boxShadow: '0 0 10px rgba(255,255,255,0.7)' }}
                    />
                  </div>
                </div>

                {/* Stats Counter Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                  <div>
                    <div className="text-lg font-extrabold text-emerald-400">{glued}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500/80 mt-0.5">Coladas</div>
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-amber-400">{repeated}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500/80 mt-0.5">Repetidas</div>
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-rose-400">{missing}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500/80 mt-0.5">Faltando</div>
                  </div>
                </div>
              </div>

              {/* Highlights section (2 column grid) */}
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-500/80 block mb-2.5 uppercase">DESTAQUES DE COMPLETUDE</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {topSecs.map((s) => {
                    const sPct = Math.round((s.glued / s.total) * 100);
                    const secColor = s.type === 'special' ? 'bg-amber-500' : s.type === 'sponsor' ? 'bg-blue-400' : 'bg-emerald-500';
                    return (
                      <div key={s.code} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-medium truncate pr-2" title={s.name}>{s.name}</span>
                          <span className="text-slate-400 font-bold text-[10px] tabular-nums shrink-0">{sPct}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${secColor}`} style={{ width: `${sPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Subtle watermark footer */}
            <div className="flex justify-between items-center text-[9px] font-semibold text-slate-600 tracking-wider pt-4 mt-5 border-t border-white/5 relative z-10">
              <span>ALBUMCOPA2026.APP</span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Hidden Canvas used for high-res downloads/shares */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          {/* Action buttons */}
          {rendered && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={shareNative}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}
              >
                <Share2 size={14} /> Compartilhar
              </button>
              <button
                onClick={copyImage}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-200 transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Copy size={14} /> Copiar
              </button>
              <button
                onClick={downloadImage}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-200 transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Download size={14} /> Baixar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function roundRectFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w <= 0) return;
  roundRect(ctx, x, y, w, h, Math.min(r, w / 2, h / 2));
  ctx.fill();
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
