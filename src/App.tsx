import React from 'react';
import {
  Printer, FileText, CheckCircle2, XCircle, RefreshCw, Search, X, BookOpen,
  Users, ArrowLeftRight, Copy, Heart, LogOut, Loader2,
  MapPin, User, Cloud, CloudOff, Trash2, Trophy, Bell, Crown, Lock,
  Image, BellOff, BellRing, ChevronLeft, ChevronRight, Medal,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { SECTIONS, TOTAL_STICKERS, Section } from './data';
import { supabase, loadCollectionFromDB, saveCollectionToDB, loadNotifications, loadProfile, saveProfile, savePushSubscription, removePushSubscription } from './supabase';
import type { CollectionMap, TradeRequest } from './supabase';
import AuthScreen from './AuthScreen';
import ProfileModal from './ProfileModal';
import NearbyModal from './NearbyModal';
import NotificationsPanel from './NotificationsPanel';
import ChatModal from './ChatModal';
import TradeHistoryModal from './TradeHistoryModal';
import ShareProgressModal from './ShareProgressModal';
import UpgradeModal from './UpgradeModal';

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG_PAGE    = 'linear-gradient(160deg,#021a0e 0%,#032d15 50%,#021a0e 100%)';
// const STADIUM_BG = 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1920';
const GLASS_SM   = { background: 'rgba(0,40,15,0.5)', border: '1px solid rgba(0,200,80,0.1)' };
const GLASS_MD   = { background: 'rgba(0,50,18,0.55)', border: '1px solid rgba(0,200,80,0.12)' };
const BLUE_GRAD  = 'linear-gradient(135deg,#065f46,#059669)';
const GREEN_GRAD = 'linear-gradient(135deg,#15803d,#16a34a)';
const RED_GRAD   = 'linear-gradient(135deg,#9f1239,#e11d48)';

const TYPE_BADGE: Record<string, React.CSSProperties> = {
  special: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' },
  sponsor: { background: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' },
  team:    { background: 'rgba(16,185,129,0.1)',   color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' },
};
const TYPE_LABEL: Record<string, string> = {
  special: 'Especial',
  sponsor: 'Refrigerante',
  team:    'Seleção',
};

function TypeDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    special: '#fbbf24',
    sponsor: '#60a5fa',
    team:    '#34d399',
  };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: colors[type] ?? '#94a3b8' }}
    />
  );
}

// ─── Push helper ─────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  const out     = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// ─── Encode / Decode (legacy, kept for reading old shared links) ───────────────
function decodeCollection(encoded: string): CollectionMap | null {
  try { return JSON.parse(decodeURIComponent(atob(encoded))); } catch {
    try { return JSON.parse(atob(encoded)); } catch { return null; }
  }
}
function collectionUrlForUser(userId: string): string {
  return `${window.location.origin}${window.location.pathname}?uid=${userId}`;
}
// function shortDisplayUrl(userId: string): string {
//   return `${window.location.hostname}/?uid=${userId.slice(0, 8)}...`;
// }

// ─── Trade analysis ───────────────────────────────────────────────────────────
interface TradeResult { youCanGive: string[]; youCanReceive: string[]; }

function analyzeTrade(mine: CollectionMap, theirs: CollectionMap): TradeResult {
  const youCanGive: string[] = [], youCanReceive: string[] = [];
  for (const sec of SECTIONS) {
    for (const sticker of sec.stickers) {
      const myCount    = mine[sec.code]?.[sticker]   ?? 0;
      const theirCount = theirs[sec.code]?.[sticker] ?? 0;
      if (myCount > 1 && theirCount === 0)    youCanGive.push(sticker);
      if (theirCount > 1 && myCount === 0) youCanReceive.push(sticker);
    }
  }
  return { youCanGive, youCanReceive };
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ collection, userId, onClose, showToast }: {
  collection: CollectionMap;
  userId: string;
  onClose: () => void;
  showToast: (msg: string, warn?: boolean) => void;
}) {
  const [tradeInput, setTradeInput]   = React.useState('');
  const [tradeResult, setTradeResult] = React.useState<TradeResult | null>(null);
  const [tradeError, setTradeError]   = React.useState('');
  const [activeTab, setActiveTab]     = React.useState<'mycollection' | 'trade'>('mycollection');
  const myCollectionUrl               = collectionUrlForUser(userId);
  // const myShortDisplayUrl             = shortDisplayUrl(userId);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => showToast(label));
    onClose();
  }
  function shareWhatsApp(text: string) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }
  async function analyzeFriendLink() {
    setTradeError(''); setTradeResult(null);
    const url = tradeInput.trim();
    if (!url) { setTradeError('Cole o link do seu amigo aqui.'); return; }
    try {
      const p = new URL(url);
      const uid = p.searchParams.get('uid');
      if (uid) {
        const { data } = await supabase.from('collections').select('data').eq('user_id', uid).maybeSingle();
        if (!data?.data) { setTradeError('Coleção não encontrada. Verifique o link.'); return; }
        setTradeResult(analyzeTrade(collection, data.data as CollectionMap));
        return;
      }
      const encoded = p.searchParams.get('data') ?? '';
      const theirs = decodeCollection(encoded);
      if (!theirs) { setTradeError('Link inválido. Peça ao seu amigo para copiar o link novamente.'); return; }
      setTradeResult(analyzeTrade(collection, theirs));
    } catch {
      setTradeError('Link inválido. Peça ao seu amigo para copiar o link novamente.');
    }
  }

  const tabs = [
    { id: 'mycollection' as const, label: 'Minha Coleção',  icon: <Copy size={13} /> },
    { id: 'trade'        as const, label: 'Analisar Troca', icon: <ArrowLeftRight size={13} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #091b35 0%, #041221 60%, #020711 100%)',
          border: '1px solid rgba(56,189,248,0.3)',
          boxShadow: '0 20px 50px -10px rgba(56,189,248,0.25)',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BLUE_GRAD }}>
              <Users size={17} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-white">Compartilhar &amp; Trocas</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              style={activeTab === tab.id ? { background: BLUE_GRAD } : {}}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-4 overflow-y-auto flex-1">
          {activeTab === 'mycollection' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm leading-relaxed">
                Compartilhe seu link de coleção com um amigo. Ele pode colar na aba "Analisar Troca" para ver o que vocs podem trocar.
              </p>
              <div className="rounded-2xl p-3" style={GLASS_SM}>
                <p className="text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-widest">Seu link</p>
                <p className="text-xs text-emerald-400 font-mono font-bold break-all">{myCollectionUrl}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(myCollectionUrl, 'Link da coleção copiado!')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-slate-200 transition-all hover:bg-white/10"
                  style={GLASS_MD}
                >
                  <Copy size={14} /> Copiar link
                </button>
                <button
                  onClick={() => shareWhatsApp(`OBA!!! Você recebeu uma proposta de troca! 🎴\nClique no link e veja o resultado da possibilidade que cada um pode receber:\n\n${myCollectionUrl}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background: GREEN_GRAD }}
                >
                  <WhatsAppIcon size={14} /> WhatsApp
                </button>
              </div>
            </div>
          )}

          {activeTab === 'trade' && (
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="rounded-2xl p-4" style={GLASS_SM}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Envie seu link ao amigo</p>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">
                  Compartilhe seu link de coleção via WhatsApp. Peça ao seu amigo para fazer o mesmo e te enviar o link dele.
                </p>
                <button
                  onClick={() => shareWhatsApp(`OBA!!! Você recebeu uma proposta de troca! 🎴\nClique no link e veja o resultado da possibilidade que cada um pode receber:\n\n${myCollectionUrl}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background: GREEN_GRAD }}
                >
                  <WhatsAppIcon size={14} /> Enviar meu link via WhatsApp
                </button>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl p-4" style={GLASS_SM}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Cole o link do seu amigo</p>
                </div>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2"
                  style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${tradeError ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.1)'}` }}
                >
                  <input
                    value={tradeInput}
                    onChange={(e) => { setTradeInput(e.target.value); setTradeError(''); setTradeResult(null); }}
                    placeholder="Cole o link do amigo aqui..."
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
                  />
                  {tradeInput && (
                    <button onClick={() => { setTradeInput(''); setTradeError(''); setTradeResult(null); }} className="text-slate-600 hover:text-white transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
                {tradeError && <p className="text-xs text-rose-400 mb-2">{tradeError}</p>}
                <button
                  onClick={analyzeFriendLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background: BLUE_GRAD }}
                >
                  <ArrowLeftRight size={14} /> Analisar Trocas
                </button>
              </div>

              {tradeResult && <TradeResultPanel result={tradeResult} onShareWhatsApp={(t) => shareWhatsApp(t)} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trade Result Panel ───────────────────────────────────────────────────────
function TradeResultPanel({ result, onShareWhatsApp }: { result: TradeResult; onShareWhatsApp: (t: string) => void }) {
  const canGive = result.youCanGive.length, canReceive = result.youCanReceive.length;
  const total   = canGive + canReceive;

  function buildWhatsAppText() {
    let msg = `Análise de troca — Álbum Copa 2026\n\n`;
    if (canGive)    msg += `Eu tenho ${canGive} repetida(s) que você precisa:\n${result.youCanGive.join(', ')}\n\n`;
    if (canReceive) msg += `Você tem ${canReceive} repetida(s) que eu preciso:\n${result.youCanReceive.join(', ')}\n\n`;
    if (!canGive && !canReceive) msg += `Nenhuma troca possível no momento.\n\n`;
    msg += `Use o app: ${window.location.origin}${window.location.pathname}`;
    return msg;
  }

  function handlePrint() { window.print(); }

  function handlePDF() {
    const content = buildPDFContent(result, canGive, canReceive);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(content);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl p-4 text-center" style={GLASS_SM}>
        <p className="text-slate-400 text-sm">Nenhuma troca possível no momento.</p>
        <p className="text-xs text-slate-600 mt-1">Vocês não têm figurinhas repetidas que o outro precisa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-emerald-400">Você pode DAR ao amigo</p>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{canGive}</span>
        </div>
        {canGive > 0
          ? <div className="overflow-y-auto max-h-36 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(52,211,153,0.3) transparent' }}>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">{result.youCanGive.join(' · ')}</p>
            </div>
          : <p className="text-xs text-slate-600">Nenhuma repetida que o amigo precisa.</p>}
      </div>
      <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-blue-400">Você pode RECEBER do amigo</p>
          <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{canReceive}</span>
        </div>
        {canReceive > 0
          ? <div className="overflow-y-auto max-h-36 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(96,165,250,0.3) transparent' }}>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">{result.youCanReceive.join(' · ')}</p>
            </div>
          : <p className="text-xs text-slate-600">Nenhuma repetida do amigo que você precisa.</p>}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={() => onShareWhatsApp(buildWhatsAppText())}
          className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
          style={{ background: GREEN_GRAD }}
        >
          <WhatsAppIcon size={16} />
          WhatsApp
        </button>
        <button
          onClick={handlePrint}
          className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-slate-200 transition-all hover:bg-white/10 active:scale-95"
          style={GLASS_MD}
        >
          <Printer size={16} />
          Imprimir
        </button>
        <button
          onClick={handlePDF}
          className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#b91c1c,#dc2626)' }}
        >
          <FileText size={16} />
          Gerar PDF
        </button>
      </div>
    </div>
  );
}

function buildPDFContent(result: TradeResult, canGive: number, canReceive: number): string {
  const date = new Date().toLocaleDateString('pt-BR');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Análise de Troca — Copa 2026</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #111; }
  h1 { color: #14532d; font-size: 22px; margin-bottom: 4px; }
  .date { color: #666; font-size: 12px; margin-bottom: 28px; }
  .section { border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
  .give { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .receive { background: #eff6ff; border: 1px solid #bfdbfe; }
  .section h2 { font-size: 14px; margin: 0 0 8px; }
  .give h2 { color: #15803d; }
  .receive h2 { color: #1d4ed8; }
  .stickers { font-family: monospace; font-size: 12px; line-height: 1.8; color: #333; }
  .badge { display: inline-block; border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: bold; margin-left: 8px; }
  .give .badge { background: #dcfce7; color: #15803d; }
  .receive .badge { background: #dbeafe; color: #1d4ed8; }
  .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>Análise de Troca — Álbum Copa 2026</h1>
<div class="date">Gerado em ${date}</div>
<div class="section give">
  <h2>Você pode DAR ao amigo <span class="badge">${canGive}</span></h2>
  <div class="stickers">${canGive > 0 ? result.youCanGive.join(' &nbsp;·&nbsp; ') : 'Nenhuma repetida que o amigo precisa.'}</div>
</div>
<div class="section receive">
  <h2>Você pode RECEBER do amigo <span class="badge">${canReceive}</span></h2>
  <div class="stickers">${canReceive > 0 ? result.youCanReceive.join(' &nbsp;·&nbsp; ') : 'Nenhuma repetida do amigo que você precisa.'}</div>
</div>
<div class="footer">Gerado pelo app do Álbum Copa 2026</div>
</body></html>`;
}

// ─── Print View ───────────────────────────────────────────────────────────────
function PrintView({ collection, onClose }: { collection: CollectionMap; onClose: () => void }) {
  const [mode, setMode] = React.useState<'glued' | 'repeated' | 'missing'>('glued');

  const rows: { section: Section; sticker: string; count: number }[] = [];
  for (const section of SECTIONS) {
    for (const sticker of section.stickers) {
      const count = collection[section.code]?.[sticker] ?? 0;
      if ((mode === 'glued' && count === 1) || (mode === 'repeated' && count > 1) || (mode === 'missing' && count === 0)) {
        rows.push({ section, sticker, count });
      }
    }
  }

  const labels: Record<typeof mode, string> = { glued: 'Coladas no Álbum', repeated: 'Repetidas para Troca', missing: 'Faltando Comprar' };

  return (
    <div className="fixed inset-0 z-50 bg-white text-gray-900 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6 print:hidden gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-gray-900">Lista — {labels[mode]}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {(['glued', 'repeated', 'missing'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${mode === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {labels[m]}
                </button>
              ))}
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
              <Printer size={14} /> Imprimir
            </button>
            <button onClick={onClose} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <h3 className="text-lg font-bold mb-4 hidden print:block">Álbum Copa do Mundo — {labels[mode]}</h3>
        {rows.length === 0 ? (
          <p className="text-gray-400 text-center py-16 text-sm">Nenhuma figurinha nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {rows.map(({ section, sticker, count }) => (
              <div key={sticker} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <TypeDot type={section.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 truncate">{section.name}</div>
                  <div className="font-bold text-sm font-mono">{sticker}</div>
                </div>
                {mode === 'repeated' && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 shrink-0">+{count - 1}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Searchable Dropdown ──────────────────────────────────────────────────────
function SearchableDropdown({ sections, selectedCode, onSelect }: {
  sections: Section[];
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  const [open, setOpen]   = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef          = React.useRef<HTMLInputElement>(null);
  const containerRef      = React.useRef<HTMLDivElement>(null);
  const selected          = sections.find((s) => s.code === selectedCode)!;

  const filtered = query.trim()
    ? sections.filter((s) => s.code.toLowerCase().startsWith(query.toLowerCase()) || s.name.toLowerCase().includes(query.toLowerCase()))
    : sections;

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function pick(code: string) { onSelect(code); setOpen(false); setQuery(''); }

  return (
    <div ref={containerRef} className="relative w-full">
      {open ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef} autoFocus value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Brasil, BRA, Argentina..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
          />
          {query && <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white transition-colors"><X size={13} /></button>}
        </div>
      ) : (
        <button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 30); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/10"
          style={GLASS_MD}
        >
          <TypeDot type={selected.type} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{selected.code}</div>
            <div className="text-white text-sm font-semibold truncate">{selected.name}</div>
          </div>
          <Search size={14} className="text-slate-500 shrink-0" />
        </button>
      )}

      {open && (
        <div className="absolute z-40 w-full mt-1.5 rounded-2xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto" style={{ background: '#07111e', border: '1px solid rgba(255,255,255,0.1)' }}>
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-slate-500 text-sm">Nenhum resultado.</div>
          ) : filtered.map((s) => (
            <button
              key={s.code}
              onClick={() => pick(s.code)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/6 ${s.code === selectedCode ? 'bg-white/5' : ''}`}
            >
              <TypeDot type={s.type} />
              <span className="font-mono text-[10px] text-slate-500 w-9 shrink-0 uppercase">{s.code}</span>
              <span className="text-sm text-white truncate flex-1">{s.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={TYPE_BADGE[s.type]}>{TYPE_LABEL[s.type]}</span>
              {s.code === selectedCode && <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sticker Card ─────────────────────────────────────────────────────────────
function StickerBtn({ id, count, onClick, onRemove }: { id: string; count: number; onClick: () => void; onRemove: () => void }) {
  const [flash, setFlash] = React.useState(false);
  const missing  = count === 0;
  const glued    = count === 1;
  const repeated = count > 1;

  let cardBg: string;
  let cardBorder: string;
  if (repeated)   { cardBg = 'rgba(251,191,36,0.10)';   cardBorder = 'rgba(251,191,36,0.35)'; }
  else if (glued) { cardBg = 'rgba(16,185,129,0.10)';   cardBorder = 'rgba(16,185,129,0.35)'; }
  else            { cardBg = 'rgba(255,255,255,0.05)';  cardBorder = 'rgba(255,255,255,0.12)'; }

  const idColor    = repeated ? '#fbbf24' : glued ? '#34d399' : '#e2e8f0';
  const statusColor = repeated ? '#f59e0b' : glued ? '#10b981' : '#475569';

  function handleAdd() {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    onClick();
  }

  return (
    <div
      className="relative rounded-xl border transition-all duration-150 select-none"
      style={{ background: cardBg, borderColor: cardBorder, outline: flash ? '2px solid rgba(52,211,153,0.6)' : '2px solid transparent', transition: 'outline 0.15s, transform 0.1s' }}
    >
      {/* Main clickable area — tap/click adds the sticker */}
      <button
        onClick={handleAdd}
        className="w-full flex flex-col items-center justify-center pt-3.5 pb-3 px-1 gap-1.5 active:scale-95 transition-transform"
        title={`Adicionar ${id}`}
        style={{ cursor: 'pointer' }}
      >
        <span className="text-sm font-bold leading-none font-mono" style={{ color: idColor }}>{id}</span>
        <span className="text-xs leading-none font-bold" style={{ color: statusColor }}>
          {repeated ? `×${count}` : glued ? '✓' : '+'}
        </span>
      </button>

      {/* Remove button — only shown when sticker exists */}
      {!missing && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-md"
          title="Remover"
          style={{ background: '#f43f5e', color: '#fff', fontSize: '14px', fontWeight: 700, lineHeight: 1 }}
        >
          −
        </button>
      )}
    </div>
  );
}

// ─── Save Indicator ───────────────────────────────────────────────────────────
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  const map = {
    saving: { icon: <Loader2 size={11} className="animate-spin" />, label: 'Salvando...', color: '#64748b' },
    saved:  { icon: <Cloud size={11} />,    label: 'Salvo',         color: '#34d399' },
    error:  { icon: <CloudOff size={11} />, label: 'Erro',          color: '#f43f5e' },
  };
  const { icon, label, color } = map[state];
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all" style={{ color, background: 'rgba(255,255,255,0.04)' }}>
      {icon}<span className="hidden sm:inline">{label}</span>
    </div>
  );
}

// ─── Reset Modal ──────────────────────────────────────────────────────────────
function ResetModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-sm rounded-3xl p-7 shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #2c0f16 0%, #15060a 60%, #0a0204 100%)',
          border: '1px solid rgba(244,63,94,0.35)',
          boxShadow: '0 20px 50px -10px rgba(244,63,94,0.25)'
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(244,63,94,0.1)' }}>
          <Trash2 size={22} className="text-rose-500" />
        </div>
        <h2 className="text-lg font-bold text-white text-center mb-2">Resetar coleção?</h2>
        <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">Todas as figurinhas serão removidas. Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-300 transition-all hover:bg-white/10" style={GLASS_MD}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95" style={{ background: RED_GRAD }}>
            Resetar tudo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Top 10 ───────────────────────────────────────────────────────────────────
interface Top10Entry {
  id: string;
  display_name: string;
  glued: number;
  pct: number;
}

function Top10Section({ userId }: { userId: string }) {
  const [entries, setEntries] = React.useState<Top10Entry[]>([]);
  const [myRank, setMyRank]   = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,display_name')
        .eq('show_in_nearby', true);

      if (!profiles || profiles.length === 0) { setLoading(false); return; }

      const { data: collections } = await supabase
        .from('collections')
        .select('user_id,data')
        .in('user_id', profiles.map((p: { id: string }) => p.id));

      const collMap: Record<string, CollectionMap> = {};
      (collections ?? []).forEach((c: { user_id: string; data: CollectionMap }) => {
        collMap[c.user_id] = c.data;
      });

      const ranked: Top10Entry[] = profiles.map((p: { id: string; display_name: string }) => {
        const coll = collMap[p.id] ?? {};
        let glued = 0;
        for (const sec of SECTIONS)
          for (const s of sec.stickers)
            if ((coll[sec.code]?.[s] ?? 0) >= 1) glued++;
        return { id: p.id, display_name: p.display_name || 'Colecionador', glued, pct: Math.round((glued / TOTAL_STICKERS) * 100) };
      });

      ranked.sort((a, b) => b.pct - a.pct);
      const rank = ranked.findIndex((e) => e.id === userId);
      setMyRank(rank >= 0 ? rank + 1 : null);

      const top10 = ranked.slice(0, 10);
      if (rank >= 10) top10.push(ranked[rank]);
      setEntries(top10);
      setLoading(false);
    })();
  }, [userId]);

  const displayedEntries = React.useMemo(() => {
    if (loading || entries.length === 0) return [];
    if (expanded) return entries;
    
    const top3 = entries.slice(0, Math.min(3, entries.length));
    const isMeInTop3 = top3.some(e => e.id === userId);
    
    if (!isMeInTop3) {
      const myEntry = entries.find(e => e.id === userId);
      if (myEntry) {
        return [...top3, myEntry];
      }
    }
    return top3;
  }, [entries, expanded, userId, loading]);

  const medalColor = (rank: number) => {
    if (rank === 1) return { bg: 'rgba(251,191,36,0.18)', color: '#fbbf24' };
    if (rank === 2) return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' };
    if (rank === 3) return { bg: 'rgba(180,83,9,0.15)', color: '#d97706' };
    return { bg: 'rgba(255,255,255,0.05)', color: '#475569' };
  };

  return (
    <div className="mb-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#b45309,#f59e0b)' }}>
          <Trophy size={15} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-tight">Top 10 Colecionadores</p>
          <p className="text-[11px] text-slate-500">Por completude do álbum</p>
        </div>
        {myRank !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Medal size={11} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-300">#{myRank}</span>
          </div>
        )}
      </div>

      {/* List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 size={18} className="text-slate-600 animate-spin" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="py-8 text-center">
            <Trophy size={22} className="text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Nenhum colecionador no ranking ainda.</p>
            <p className="text-[11px] text-slate-700 mt-1">Ative "Aparecer na busca" no seu perfil.</p>
          </div>
        )}

        {displayedEntries.map((e, i) => {
          const isMe = e.id === userId;
          const originalIndex = entries.findIndex(item => item.id === e.id);
          const globalRank = (isMe && myRank) ? myRank : originalIndex + 1;
          const isSeparator = isMe && myRank && (expanded ? myRank > 10 : myRank > 3);
          const mc = medalColor(globalRank);

          return (
            <React.Fragment key={e.id}>
              {isSeparator && (
                <div className="flex items-center gap-2 px-4 py-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[10px] text-slate-700 font-medium">sua posição</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}
              <div
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={{
                  background: isMe ? 'rgba(245,158,11,0.07)' : 'transparent',
                  borderBottom: (i < displayedEntries.length - 1 || entries.length > 3) ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-extrabold"
                  style={mc}
                >
                  {globalRank <= 3 ? (globalRank === 1 ? '1' : globalRank === 2 ? '2' : '3') : `${globalRank}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight" style={{ color: isMe ? '#fde68a' : '#e2e8f0' }}>
                    {e.display_name}
                    {isMe && <span className="text-amber-600 ml-1.5 text-[10px] font-normal">(você)</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${e.pct}%`, background: isMe ? '#f59e0b' : globalRank <= 3 ? '#f59e0b' : '#334155', opacity: isMe ? 1 : globalRank <= 3 ? 0.7 : 1 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold" style={{ color: isMe ? '#fbbf24' : globalRank <= 3 ? '#f59e0b' : '#64748b' }}>{e.pct}%</p>
                  <p className="text-[10px] text-slate-700">{e.glued}/{TOTAL_STICKERS}</p>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {!loading && entries.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            style={{
              background: 'rgba(255,255,255,0.015)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {expanded ? (
              <>
                Mostrar menos <ChevronUp size={14} />
              </>
            ) : (
              <>
                Ver ranking completo ({Math.min(10, entries.length)} colocados) <ChevronDown size={14} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Completed Albums Counter ─────────────────────────────────────────────────
function CompletedAlbumsSection() {
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetch('/api/completed-albums')
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0));
  }, []);

  const displayCount = count ?? 0;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#065f46,#10b981)' }}>
          <BookOpen size={15} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-tight">Álbuns Completados com nossa ajuda</p>
          <p className="text-[11px] text-slate-500">Colecionadores que atingiram 100%</p>
        </div>
      </div>
      <div
        className="rounded-2xl overflow-hidden flex items-center justify-center py-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="text-center">
          <p className="text-4xl font-extrabold" style={{ color: '#10b981' }}>{displayCount}</p>
          <p className="text-xs text-slate-500 mt-1">{displayCount === 1 ? 'álbum completado' : 'álbuns completados'}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Banner ────────────────────────────────────────────────────────────
function InviteBanner({ onNearby, userId, isPremium, onUpgrade }: { onNearby: () => void; userId: string; isPremium: boolean; onUpgrade: () => void }) {
  const appUrl           = `${window.location.origin}${window.location.pathname}`;
  const [copied, setCopied] = React.useState(false);

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Gostei muito desse app para gerenciar o álbum da Copa 2026! Vale a pena:\n\n${appUrl}`)}`, '_blank');
  }
  function handleCopy() {
    navigator.clipboard.writeText(appUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Nearby — destaque principal */}
      <button
        onClick={isPremium ? onNearby : onUpgrade}
        className="w-full rounded-3xl text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] overflow-hidden relative"
        style={{
          background: 'linear-gradient(120deg, #064e3b 0%, #065f46 40%, #047857 100%)',
          boxShadow: '0 8px 32px rgba(4,120,87,0.4), 0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: '#34d399' }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: '#06b6d4' }} />

        <div className="relative flex items-center gap-5 px-6 py-5">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <MapPin size={26} className="text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Funcionalidade em destaque</p>
              {!isPremium && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.25)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)' }}>
                  <Crown size={9} /> Premium
                </span>
              )}
            </div>
            <p className="text-lg font-extrabold text-white leading-tight">Colecionadores Proximos</p>
            <p className="text-sm text-white/70 mt-0.5 leading-snug">Encontre quem pode trocar figurinhas perto de voce e feche trocas na hora</p>
          </div>

          {/* Arrow / Lock */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {isPremium ? <ArrowLeftRight size={16} className="text-white" /> : <Lock size={16} className="text-amber-300" />}
          </div>
        </div>
      </button>

      {/* Top 10 */}
      <Top10Section userId={userId} />

      {/* Completed albums counter */}
      <CompletedAlbumsSection />

      {/* Invite — secundário */}
      <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
          <Heart size={15} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Indique o app para um amigo!</p>
          <p className="text-xs text-slate-500 mt-0.5">Compartilhe e façam trocas juntos</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 active:scale-95" style={GLASS_SM}>
            <Copy size={11} />{copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button onClick={handleWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95" style={{ background: GREEN_GRAD }}>
            <WhatsAppIcon size={11} /> WA
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
// function StatCard({ icon, label, value, total, color }: {
//   icon: React.ReactNode; label: string; value: number; total?: number; color: 'emerald' | 'amber' | 'rose';
// }) {
//   const c = {
//     emerald: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)', text: '#10b981', glow: 'rgba(16,185,129,0.15)' },
//     amber:   { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', text: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
//     rose:    { bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.15)',  text: '#f43f5e', glow: 'rgba(244,63,94,0.15)'  },
//   }[color];
//   return (
//     <div className="rounded-2xl p-4 border relative overflow-hidden" style={{ background: c.bg, borderColor: c.border }}>
//       <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-40 blur-2xl -mr-4 -mt-4" style={{ background: c.glow }} />
//       <div className="relative">
//         <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-3" style={{ color: c.text, background: `${c.bg}` }}>
//           {icon}
//         </div>
//         <div className="text-2xl font-extrabold text-white tracking-tight">{value.toLocaleString('pt-BR')}</div>
//         <div className="text-xs text-slate-500 mt-0.5 font-medium">
//           {label}{total !== undefined && <span className="text-slate-700 font-normal"> / {total}</span>}
//         </div>
//       </div>
//     </div>
//   );
// }

function LegendItem({ marker, bg, border, color, label }: { marker: string; bg: string; border: string; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold" style={{ background: bg, borderColor: border, color }}>
        {marker}
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

// ─── Sticker List Modal (por país) ───────────────────────────────────────────
function StickerListModal({ collection, onClose, initialFilter = 'coladas' }: { collection: CollectionMap; onClose: () => void; initialFilter?: 'coladas' | 'repetidas' | 'faltando' }) {
  const [filter, setFilter] = React.useState<'coladas' | 'repetidas' | 'faltando'>(initialFilter);
  const [expandedCode, setExpandedCode] = React.useState<string | null>(null);

  const filterLabels = { coladas: 'Coladas', repetidas: 'Repetidas', faltando: 'Faltando' };

  const sectionData = SECTIONS.map((sec) => {
    const stickers = sec.stickers.map((id) => ({
      id,
      count: collection[sec.code]?.[id] ?? 0,
    }));
    const coladas   = stickers.filter((s) => s.count === 1);
    const repetidas = stickers.filter((s) => s.count > 1);
    const faltando  = stickers.filter((s) => s.count === 0);
    const list = filter === 'coladas' ? coladas : filter === 'repetidas' ? repetidas : faltando;
    return { sec, coladas, repetidas, faltando, list };
  }).filter((d) => d.list.length > 0);

  function buildPrintHtml() {
    const date = new Date().toLocaleDateString('pt-BR');
    const fc = filter === 'coladas' ? '#15803d' : filter === 'repetidas' ? '#92400e' : '#9f1239';
    const fb = filter === 'coladas' ? '#f0fdf4' : filter === 'repetidas' ? '#fffbeb' : '#fff1f2';
    const fd = filter === 'coladas' ? '#86efac' : filter === 'repetidas' ? '#fcd34d' : '#fca5a5';
    const sectionsHtml = sectionData.map(({ sec, list }) => {
      const tc = sec.type === 'special' ? '#92400e' : sec.type === 'sponsor' ? '#1e40af' : '#14532d';
      const tags = list.map(({ id, count }) =>
        `<span class="t">${id}${filter === 'repetidas' ? `<sup>×${count}</sup>` : ''}</span>`
      ).join('');
      return `<div class="sb"><div class="sh"><span class="sc" style="background:${tc}">${sec.code}</span><b>${sec.name}</b><span class="sn">${list.length}</span></div><div class="sw">${tags}</div></div>`;
    }).join('');
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Lista ${filterLabels[filter]} — Copa 2026</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;color:#111;font-size:9px;padding:8px}
h1{color:#14532d;font-size:13px;margin-bottom:1px}
.dt{color:#888;font-size:8px;margin-bottom:8px}
.sb{border:1px solid #e5e7eb;border-radius:5px;margin-bottom:4px;break-inside:avoid;page-break-inside:avoid;overflow:hidden}
.sh{background:#f3f4f6;padding:4px 7px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #e5e7eb}
.sc{color:#fff;font-family:monospace;font-size:8px;font-weight:bold;padding:1px 5px;border-radius:3px;white-space:nowrap}
.sn{color:#6b7280;font-size:8px;margin-left:auto}
.sw{padding:4px 7px;display:flex;flex-wrap:wrap;gap:2px}
.t{display:inline-block;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:8px;font-weight:bold;border:1px solid ${fd};background:${fb};color:${fc}}
.t sup{font-size:6px;opacity:0.7}
@page{margin:8mm}
</style></head><body>
<h1>Copa 2026 — ${filterLabels[filter]}</h1>
<div class="dt">Gerado em ${date}</div>
${sectionsHtml}
</body></html>`;
  }

  function openBlob(html: string, autoPrint: boolean) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    if (autoPrint) {
      const w = window.open(url, '_blank');
      if (w) setTimeout(() => { w.print(); }, 600);
    }
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  function handlePrint() {
    const html = buildPrintHtml().replace('</body>', '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},400)})</script></body>');
    openBlob(html, false);
  }

  function handlePDF() {
    openBlob(buildPrintHtml(), false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-white text-gray-900 overflow-auto">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 6px !important; }
          .print-section .px-5 { padding-left: 8px !important; padding-right: 8px !important; }
          .print-section .py-4 { padding-top: 5px !important; padding-bottom: 5px !important; }
          .print-section .gap-2 { gap: 3px !important; }
          .print-section span[class*="px-3"] { padding-left: 5px !important; padding-right: 5px !important; padding-top: 1px !important; padding-bottom: 1px !important; font-size: 10px !important; }
          .print-section .rounded-2xl { border-radius: 6px !important; }
          .print-header-block { padding: 4px 8px !important; }
          body { font-size: 10px; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 no-print gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-gray-900">Lista por País — {filterLabels[filter]}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {(['coladas', 'repetidas', 'faltando'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${filter === f ? 'bg-green-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-800 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <Printer size={14} /> Imprimir
            </button>
            <button
              onClick={handlePDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:brightness-110 transition-colors"
              style={{ background: 'linear-gradient(135deg,#b91c1c,#dc2626)' }}
            >
              <FileText size={14} /> Gerar PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors no-print">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Print title */}
        <h3 className="text-lg font-bold mb-4 hidden print:block">Álbum Copa 2026 — {filterLabels[filter]} por País</h3>

        {sectionData.length === 0 ? (
          <p className="text-gray-400 text-center py-16 text-sm">Nenhuma figurinha nesta categoria.</p>
        ) : (
          <div className="space-y-4">
            {sectionData.map(({ sec, coladas, repetidas, faltando, list }) => {
              const isExpanded = expandedCode === sec.code;
              const pct = Math.round((coladas.length / sec.stickers.length) * 100);
              const typeColor = sec.type === 'special' ? '#92400e' : sec.type === 'sponsor' ? '#1e40af' : '#14532d';

              return (
                <div key={sec.code} className="print-section border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Section header — always visible, click to expand on screen */}
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors no-print text-left"
                    onClick={() => setExpandedCode(isExpanded ? null : sec.code)}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-mono text-sm font-bold text-white shrink-0" style={{ background: typeColor }}>
                      {sec.code.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900">{sec.name}</div>
                      <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                        <span className="text-green-700 font-semibold">{coladas.length} coladas</span>
                        <span className="text-amber-700 font-semibold">{repetidas.length} repetidas</span>
                        <span className="text-red-700 font-semibold">{faltando.length} faltando</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-gray-900">{pct}%</div>
                      <div className="w-20 h-1.5 rounded-full bg-gray-200 mt-1">
                        <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm ml-2">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* Print header — compact */}
                  <div className="hidden print:flex print-header-block px-4 py-2 bg-gray-50 border-b border-gray-200 items-center gap-2">
                    <span className="font-mono text-[9px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: typeColor }}>{sec.code}</span>
                    <span className="font-bold text-gray-900 text-[10px]">{sec.name}</span>
                    <span className="text-[9px] text-gray-400 ml-auto">{list.length} fig.</span>
                  </div>

                  {/* Sticker list — screen: only when expanded; print: always */}
                  <div className={`px-4 py-3 ${isExpanded ? 'block' : 'hidden'} print:block`}>
                    {list.length === 0 ? (
                      <p className="text-gray-400 text-sm">Nenhuma figurinha nesta categoria.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 print:gap-1">
                        {list.map(({ id, count }) => (
                          <span
                            key={id}
                            className="inline-flex items-center gap-0.5 px-2 py-1 print:px-1.5 print:py-0.5 rounded text-xs print:text-[9px] font-mono font-bold border"
                            style={
                              filter === 'coladas'   ? { background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' } :
                              filter === 'repetidas' ? { background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' } :
                                                       { background: '#fff1f2', borderColor: '#fca5a5', color: '#9f1239' }
                            }
                          >
                            {id}
                            {filter === 'repetidas' && <span className="opacity-70">×{count}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Collection View (public, no login needed) ────────────────────────
function SharedCollectionView({ collection, onLogin }: { collection: CollectionMap; onLogin: () => void }) {
  let totalGlued = 0, totalRepeated = 0, totalMissing = 0;
  for (const sec of SECTIONS) {
    for (const s of sec.stickers) {
      const c = collection[sec.code]?.[s] ?? 0;
      if (c === 0) totalMissing++;
      else { totalGlued++; if (c > 1) totalRepeated += c - 1; }
    }
  }
  const progress = Math.round((totalGlued / TOTAL_STICKERS) * 100);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG_PAGE }}>
      <div className="max-w-xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen size={22} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold text-lg">Gestor de Álbuns</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Coleção Compartilhada</h1>
          <p className="text-slate-400 text-sm mt-1">Copa do Mundo 2026</p>
        </div>

        {/* Stats */}
        <div className="rounded-2xl p-5" style={GLASS_MD}>
          <div className="flex justify-between mb-3">
            <span className="text-sm text-slate-400">Progresso geral</span>
            <span className="text-sm font-bold text-emerald-400">{progress}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 mb-4">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(255,255,255,0.7)' }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-extrabold text-emerald-400">{totalGlued}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Coladas</div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-amber-400">{totalRepeated}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Repetidas</div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-rose-400">{totalMissing}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Faltando</div>
            </div>
          </div>
        </div>

        {/* Sections list */}
        <div className="space-y-2">
          {SECTIONS.map((sec) => {
            const glued   = sec.stickers.filter((s) => (collection[sec.code]?.[s] ?? 0) >= 1).length;
            const pct     = Math.round((glued / sec.stickers.length) * 100);
            const tc      = sec.type === 'special' ? '#92400e' : sec.type === 'sponsor' ? '#1e40af' : '#14532d';
            return (
              <div key={sec.code} className="rounded-xl px-4 py-3 flex items-center gap-3" style={GLASS_SM}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-white shrink-0" style={{ background: tc }}>
                  {sec.code.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{sec.name}</div>
                  <div className="w-full h-1 rounded-full bg-white/10 mt-1.5">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-400 shrink-0">{glued}/{sec.stickers.length}</div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-5 text-center" style={GLASS_MD}>
          <p className="text-white font-semibold mb-1">Quer gerenciar sua própria coleção?</p>
          <p className="text-slate-400 text-sm mb-4">Crie sua conta gratuita e comece a trocar figurinhas!</p>
          <button
            onClick={onLogin}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:brightness-110 active:scale-95"
            style={{ background: GREEN_GRAD }}
          >
            Entrar / Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = React.useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [collection, setCollection]   = React.useState<CollectionMap>({});
  const [collectionLoaded, setCollectionLoaded] = React.useState(false);
  const [selectedCode, setSelectedCode] = React.useState('ABT');
  const [showPrint, setShowPrint]       = React.useState(false);
  const [showShare, setShowShare]       = React.useState(false);
  const [showProfile, setShowProfile]   = React.useState(false);
  const [showNearby, setShowNearby]     = React.useState(false);
  const [showReset, setShowReset]           = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showTradeHistory, setShowTradeHistory] = React.useState(false);
  const [showShareProgress, setShowShareProgress] = React.useState(false);
  const [showStickerList, setShowStickerList]     = React.useState(false);
  const [stickerListFilter, setStickerListFilter] = React.useState<'coladas' | 'repetidas' | 'faltando'>('coladas');
  const [chatTrade, setChatTrade]           = React.useState<(TradeRequest & { other_name: string }) | null>(null);
  const [unreadCount, setUnreadCount]       = React.useState(0);
  const [toast, setToast]                   = React.useState<{ msg: string; warn: boolean } | null>(null);
  const [saveState, setSaveState]       = React.useState<SaveState>('idle');
  const [pushEnabled, setPushEnabled]       = React.useState(false);
  const [displayName, setDisplayName]       = React.useState('');
  const [isPremium, setIsPremium]           = React.useState(false);
  const [upgradeFeature, setUpgradeFeature] = React.useState<'nearby' | 'trades' | 'share' | null>(null);
  const pushSubRef = React.useRef<PushSubscription | null>(null);

  const saveTimer  = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionRecorded = React.useRef(false);

  // Public shared link state
  const [sharedUidParam]           = React.useState(() => new URLSearchParams(window.location.search).get('uid'));
  const [sharedCollection, setSharedCollection] = React.useState<CollectionMap | null>(null);
  const [sharedLoading, setSharedLoading]       = React.useState(!!new URLSearchParams(window.location.search).get('uid'));

  React.useEffect(() => {
    if (!sharedUidParam) return;
    setSharedLoading(true);
    supabase.from('collections').select('data').eq('user_id', sharedUidParam).maybeSingle().then(({ data }) => {
      setSharedCollection((data?.data as CollectionMap) ?? {});
      setSharedLoading(false);
    });
  }, [sharedUidParam]);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!user) { setCollection({}); setCollectionLoaded(false); return; }
    const params  = new URLSearchParams(window.location.search);
    // Legacy: ?data= (base64 encoded collection)
    const urlData = params.get('data');
    if (urlData) {
      const decoded = decodeCollection(urlData);
      window.history.replaceState({}, '', window.location.pathname);
      if (decoded) {
        setCollection(decoded);
        setCollectionLoaded(true);
        saveCollectionToDB(user.id, decoded);
        return;
      }
    }
    // ?uid= link: load another user's collection for viewing (ignored on startup — user loads their own)
    const sharedUid = params.get('uid');
    if (sharedUid) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setCollectionLoaded(false);
    loadCollectionFromDB(user.id).then((data) => {
      const hasDbData = Object.keys(data).length > 0;
      if (!hasDbData) {
        try {
          const lsRaw = localStorage.getItem('album_collection');
          if (lsRaw) {
            const lsData = JSON.parse(lsRaw) as CollectionMap;
            if (Object.keys(lsData).length > 0) {
              setCollection(lsData);
              setCollectionLoaded(true);
              saveCollectionToDB(user.id, lsData).then(() => {
                localStorage.removeItem('album_collection');
                showToast('Coleção local importada para a nuvem!');
              });
              return;
            }
          }
        } catch { /* ignore */ }
      }
      setCollection(data);
      setCollectionLoaded(true);
    });
  }, [user]);

  React.useEffect(() => {
    if (!user || !collectionLoaded) return;
    setSaveState('saving');
    if (saveTimer.current)  clearTimeout(saveTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveCollectionToDB(user.id, collection);
        setSaveState('saved');
        savedTimer.current = setTimeout(() => setSaveState('idle'), 2500);

        if (!completionRecorded.current) {
          let g = 0;
          for (const sec of SECTIONS)
            for (const s of sec.stickers)
              if ((collection[sec.code]?.[s] ?? 0) >= 1) g++;
          if (g === TOTAL_STICKERS) {
            completionRecorded.current = true;
            fetch('/api/completed-albums', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id }),
            }).catch(() => {});
          }
        }
      } catch { setSaveState('error'); }
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [collection, user, collectionLoaded]);

  React.useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    loadNotifications(user.id).then((ns) => {
      setUnreadCount(ns.filter((n) => !n.read).length);
    });
    loadProfile(user.id).then(async (p) => {
      if (!p) {
        const emailPrefix = user.email ? user.email.split('@')[0] : 'Colecionador';
        const defaultProfile = {
          id: user.id,
          display_name: emailPrefix,
          cep: '',
          lat: null,
          lng: null,
          show_in_nearby: true,
          whatsapp: '',
          accepts_trades: true,
          contact_info: '',
          is_premium: false,
        };
        try {
          await saveProfile(defaultProfile);
          setDisplayName(emailPrefix);
        } catch (e) {
          console.error('Error creating default profile:', e);
        }
      } else {
        if (p?.display_name) setDisplayName(p.display_name);
        if (p?.is_premium) setIsPremium(true);
      }
    });

    // Handle return from Stripe checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get('premium') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      // Poll briefly until webhook updates the profile
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const p = await loadProfile(user.id);
        if (p?.is_premium) { setIsPremium(true); showToast('Premium ativado! Bem-vindo!'); clearInterval(poll); }
        else if (attempts >= 6) { showToast('Pagamento recebido! Premium será ativado em instantes.'); clearInterval(poll); }
      }, 2000);
    }
    const channel = supabase
      .channel(`app_notif_badge:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setUnreadCount((c) => c + 1);
          // Browser push notification via Notification API (foreground fallback)
          if (Notification.permission === 'granted') {
            const p = payload.new as { type?: string; payload?: { sender_name?: string } };
            if (p.type === 'trade_request') {
              new Notification('Nova proposta de troca!', {
                body: `${p.payload?.sender_name ?? 'Alguém'} quer trocar figurinhas com você.`,
                icon: '/logo.svg',
              });
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Web Push setup
  React.useEffect(() => {
    if (!user || !('Notification' in window)) return;
    setPushEnabled(Notification.permission === 'granted');
  }, [user]);

  async function togglePushNotifications() {
    if (!user) return;
    if (pushEnabled) {
      if (pushSubRef.current) {
        await removePushSubscription(pushSubRef.current.endpoint);
        await pushSubRef.current.unsubscribe();
        pushSubRef.current = null;
      }
      setPushEnabled(false);
      showToast('Notificações push desativadas.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { showToast('Permissão negada.', true); return; }
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          ),
        });
        pushSubRef.current = sub;
        await savePushSubscription(user.id, sub);
        setPushEnabled(true);
        showToast('Notificações push ativadas!');
      } else {
        setPushEnabled(true);
        showToast('Notificações ativadas (modo básico).');
      }
    } catch {
      showToast('Erro ao ativar notificações.', true);
    }
  }

  function showToast(msg: string, warn = false) {
    setToast({ msg, warn });
    setTimeout(() => setToast(null), 2200);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCollection({});
    setCollectionLoaded(false);
  }

  function handleSticker(sectionCode: string, stickerId: string) {
    const cur = collection[sectionCode]?.[stickerId] ?? 0;
    setCollection((prev) => {
      const sec = { ...(prev[sectionCode] || {}) };
      sec[stickerId] = (sec[stickerId] ?? 0) + 1;
      return { ...prev, [sectionCode]: sec };
    });
    if (cur === 0)      showToast(`${stickerId} colada no álbum!`);
    else if (cur === 1) showToast(`${stickerId} — 1 repetida`, true);
    else                showToast(`${stickerId} — ${cur} repetidas`, true);
  }

  function removeSticker(sectionCode: string, stickerId: string) {
    const cur = collection[sectionCode]?.[stickerId] ?? 0;
    setCollection((prev) => {
      const sec = { ...(prev[sectionCode] || {}) };
      if (cur <= 1) { delete sec[stickerId]; }
      else { sec[stickerId] = cur - 1; }
      return { ...prev, [sectionCode]: sec };
    });
    if (cur <= 1) showToast(`${stickerId} removida`);
    else {
      const rem = cur - 2;
      showToast(rem === 0 ? `${stickerId} — colada (sem repetidas)` : `${stickerId} — ${rem} repetida(s)`, rem > 0);
    }
  }

  function handleReset() { setCollection({}); setShowReset(false); showToast('Coleção zerada.'); }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG_PAGE }}>
        <Loader2 size={28} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Public shared collection view — no login required
  if (sharedUidParam && !user) {
    if (sharedLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: BG_PAGE }}>
          <Loader2 size={28} className="text-emerald-400 animate-spin" />
        </div>
      );
    }
    if (sharedCollection) {
      return <SharedCollectionView collection={sharedCollection} onLogin={() => window.history.replaceState({}, '', window.location.pathname)} />;
    }
  }

  if (!user) return <AuthScreen onAuth={() => {}} />;

  if (!collectionLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: BG_PAGE }}>
        <Loader2 size={26} className="text-emerald-400 animate-spin" />
        <p className="text-slate-600 text-sm">Carregando sua coleção...</p>
      </div>
    );
  }

  const section     = SECTIONS.find((s) => s.code === selectedCode)!;
  const secIndex    = SECTIONS.findIndex((s) => s.code === selectedCode);
  const secColl     = collection[selectedCode] || {};
  const prevSection = secIndex > 0 ? SECTIONS[secIndex - 1] : null;
  const nextSection = secIndex < SECTIONS.length - 1 ? SECTIONS[secIndex + 1] : null;

  let totalGlued = 0, totalRepeated = 0, totalMissing = 0;
  for (const sec of SECTIONS) {
    for (const sticker of sec.stickers) {
      const count = collection[sec.code]?.[sticker] ?? 0;
      if (count === 0) totalMissing++;
      else { totalGlued++; if (count > 1) totalRepeated += count - 1; }
    }
  }
  const progress    = Math.round((totalGlued / TOTAL_STICKERS) * 100);
  const secGlued    = section.stickers.filter((s) => (secColl[s] ?? 0) >= 1).length;
  const secRepeated = section.stickers.reduce((sum, s) => sum + Math.max(0, (secColl[s] ?? 0) - 1), 0);
  const secMissing  = section.stickers.length - secGlued;

  return (
    <div
      className="min-h-screen noise"
      style={{
        background: 'linear-gradient(160deg,#021a0e 0%,#032d15 50%,#021a0e 100%)',
        overflowY: 'auto',
      }}
    >
{chatTrade && user && (
        <ChatModal
          userId={user.id}
          trade={chatTrade}
          onClose={() => setChatTrade(null)}
          onMarkComplete={() => { setChatTrade(null); showToast('Troca marcada como concluída!'); }}
        />
      )}
      {showTradeHistory && user && (
        <TradeHistoryModal
          userId={user.id}
          onClose={() => setShowTradeHistory(false)}
          onOpenChat={(trade) => { setShowTradeHistory(false); setChatTrade(trade); }}
        />
      )}
      {showShareProgress && user && (
        <ShareProgressModal
          collection={collection}
          displayName={displayName || user.email?.split('@')[0] || 'Colecionador'}
          onClose={() => setShowShareProgress(false)}
          showToast={showToast}
        />
      )}
      {showStickerList && <StickerListModal collection={collection} onClose={() => setShowStickerList(false)} initialFilter={stickerListFilter} />}
      {showPrint   && <PrintView collection={collection} onClose={() => setShowPrint(false)} />}
      {showShare   && user && <ShareModal collection={collection} userId={user.id} onClose={() => setShowShare(false)} showToast={showToast} />}
      {showProfile && user && <ProfileModal userId={user.id} onClose={() => setShowProfile(false)} />}
      {showNearby  && user && (
        <NearbyModal userId={user.id} collection={collection} onClose={() => setShowNearby(false)} onOpenProfile={() => { setShowNearby(false); setShowProfile(true); }} />
      )}      {showReset && <ResetModal onConfirm={handleReset} onClose={() => setShowReset(false)} />}
      {upgradeFeature && <UpgradeModal feature={upgradeFeature} onClose={() => setUpgradeFeature(null)} onSuccess={() => setIsPremium(true)} />}
      {showNotifications && user && (
        <NotificationsPanel
          userId={user.id}
          onClose={() => setShowNotifications(false)}
          onOpenChat={(trade) => { setShowNotifications(false); setChatTrade(trade); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-2 backdrop-blur-sm"
          style={toast.warn
            ? { background: 'rgba(28,18,0,0.95)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }
            : { background: 'rgba(255,255,255,0.95)', color: '#0f172a' }}
        >
          {toast.warn ? <RefreshCw size={13} /> : <CheckCircle2 size={13} className="text-emerald-500" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">

        {/* ── Header ── */}
        <header className="mb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <SaveIndicator state={saveState} />
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowNotifications(true); setUnreadCount(0); }}
                className="relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-amber-300 transition-colors hover:bg-white/6"
                title="Notificações"
              >
                <Bell size={13} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                    style={{ background: 'linear-gradient(135deg,#b45309,#f59e0b)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={togglePushNotifications}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-white/6 ${pushEnabled ? 'text-teal-400 hover:text-teal-300' : 'text-slate-500 hover:text-slate-200'}`}
                title={pushEnabled ? 'Desativar push' : 'Ativar notificações push'}
              >
                {pushEnabled ? <BellRing size={13} /> : <BellOff size={13} />}
              </button>

              <button onClick={() => setShowProfile(true)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors hover:bg-white/6" title="Meu perfil">
                <User size={13} /><span className="hidden sm:inline">Perfil</span>
              </button>
              <button onClick={() => setShowReset(true)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors hover:bg-white/6" title="Resetar coleção">
                <Trash2 size={13} />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors hover:bg-white/6" title="Sair">
                <LogOut size={13} /><span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Hero */}
          <div className="text-center">
            <div className="inline-flex mb-4">
              <img
                src="/logotipo.png"
                alt="Gestor Álbum Copa 2026"
                className="w-28 h-28 rounded-3xl shadow-2xl object-cover"
                style={{ boxShadow: '0 0 48px rgba(5,150,105,0.35), 0 0 0 1px rgba(245,158,11,0.2)' }}
              />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">{TOTAL_STICKERS} figurinhas · 48 seleções + especiais + refrigerantes</p>
            <p className="text-slate-700 text-xs">{user.email}</p>
          </div>
        </header>

        {/* ── Main panel ── */}
        <div className="rounded-3xl p-5 sm:p-6 mb-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Toolbar */}
          <div className="flex gap-2 items-end mb-5 flex-wrap">
            <div className="flex-1 min-w-60">
              <label className="text-sm font-bold text-slate-200 block mb-1.5">Selecione uma seção e cadastre suas figurinhas</label>
              <SearchableDropdown sections={SECTIONS} selectedCode={selectedCode} onSelect={setSelectedCode} />
            </div>
            <button
              onClick={() => setShowPrint(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 active:scale-95"
              style={GLASS_MD}
              title="Imprimir lista"
            >
              <Printer size={13} /> Imprimir
            </button>
            <button
              onClick={() => isPremium ? setShowShare(true) : setUpgradeFeature('trades')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 relative"
              style={{ background: BLUE_GRAD, boxShadow: '0 4px 20px rgba(5,150,105,0.25)' }}
              title="Compartilhar e trocas"
            >
              {isPremium ? <Users size={13} /> : <Lock size={13} />} Trocas &amp; Compartilhar
            </button>
          </div>

          {/* Section header with prev/next navigation */}
          <div
            className="flex items-center gap-2 mb-4 px-3 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Anterior */}
            <button
              onClick={() => prevSection && setSelectedCode(prevSection.code)}
              disabled={!prevSection}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              style={{ background: 'white' }}
              title={prevSection ? `Anterior: ${prevSection.name}` : 'Primeira seção'}
            >
              <ChevronLeft size={15} style={{ color: '#15803d' }} />
              <span className="text-xs font-semibold" style={{ color: '#15803d' }}>Anterior</span>
            </button>

            {/* Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm font-bold text-white shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
                {section.code.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white">{section.name}</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={TYPE_BADGE[section.type]}>{TYPE_LABEL[section.type]}</span>
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-slate-600">
                  <span><span className="text-emerald-400 font-bold">{secGlued}</span> coladas</span>
                  <span><span className="text-amber-400 font-bold">{secRepeated}</span> rep.</span>
                  <span><span className="text-rose-400 font-bold">{secMissing}</span> faltando</span>
                  <span className="text-slate-700">{secIndex + 1}/{SECTIONS.length}</span>
                </div>
              </div>
            </div>

            {/* Proxima */}
            <button
              onClick={() => nextSection && setSelectedCode(nextSection.code)}
              disabled={!nextSection}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              style={{ background: 'white' }}
              title={nextSection ? `Próxima: ${nextSection.name}` : 'Última seção'}
            >
              <span className="text-xs font-semibold" style={{ color: '#15803d' }}>Próxima</span>
              <ChevronRight size={15} style={{ color: '#15803d' }} />
            </button>
          </div>

          {/* Sticker grid */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 gap-2.5">
              {section.stickers.map((sticker) => {
                const count = secColl[sticker] ?? 0;
                return (
                  <StickerBtn
                    key={sticker}
                    id={sticker}
                    count={count}
                    onClick={() => handleSticker(selectedCode, sticker)}
                    onRemove={() => removeSticker(selectedCode, sticker)}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <LegendItem marker="✓"  bg="rgba(16,185,129,0.12)"  border="rgba(16,185,129,0.4)"  color="#34d399" label="Colada"   />
              <LegendItem marker="×N" bg="rgba(251,191,36,0.12)"  border="rgba(251,191,36,0.4)"  color="#fbbf24" label="Repetida" />
              <LegendItem marker="·"  bg="rgba(255,255,255,0.03)" border="rgba(255,255,255,0.07)" color="#334155" label="Faltando" />
            </div>
            <p className="text-[11px] text-slate-700 mt-2.5">
              <span className="text-emerald-700 font-semibold">Toque no card</span> = adiciona &nbsp;·&nbsp;
              <span className="text-rose-800 font-semibold">− no canto</span> = remove &nbsp;·&nbsp;
              1º clique = colada, 2º+ = repetida
            </p>
          </div>
        </div>

        {/* ── Stats + Progress (secondary, compact) ── */}
        <div className="rounded-2xl p-4 mb-4" style={GLASS_SM}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-200">Progresso geral</span>
              <span className="text-sm font-extrabold text-white tabular-nums">{progress}%</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowStickerList(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#14532d,#15803d)', boxShadow: '0 2px 10px rgba(20,83,45,0.4)' }}
              >
                <BookOpen size={11} /> Ver lista por país
              </button>
              <button
                onClick={() => isPremium ? setShowShareProgress(true) : setUpgradeFeature('share')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#065f46,#059669)', boxShadow: '0 2px 10px rgba(6,95,70,0.4)' }}
              >
                {isPremium ? <Image size={11} /> : <Lock size={11} />} Compartilhar progresso
              </button>
            </div>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(255,255,255,0.7)' }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setStickerListFilter('coladas'); setShowStickerList(true); }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:brightness-125 active:scale-95 cursor-pointer"
              style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.12)' }}
            >
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <div>
                <div className="text-base font-extrabold text-white leading-none">{totalGlued.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">Coladas <span className="text-slate-700">/ {TOTAL_STICKERS}</span></div>
              </div>
            </button>
            <button
              onClick={() => { setStickerListFilter('repetidas'); setShowStickerList(true); }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:brightness-125 active:scale-95 cursor-pointer"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.12)' }}
            >
              <RefreshCw size={13} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-base font-extrabold text-white leading-none">{totalRepeated.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">Repetidas</div>
              </div>
            </button>
            <button
              onClick={() => { setStickerListFilter('faltando'); setShowStickerList(true); }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:brightness-125 active:scale-95 cursor-pointer"
              style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.12)' }}
            >
              <XCircle size={13} className="text-rose-400 shrink-0" />
              <div>
                <div className="text-base font-extrabold text-white leading-none">{totalMissing.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">Faltando</div>
              </div>
            </button>
          </div>
        </div>

        {/* ── Invite banner ── */}
        {user && (
          <InviteBanner
            onNearby={() => setShowNearby(true)}
            userId={user.id}
            isPremium={isPremium}
            onUpgrade={() => setUpgradeFeature('nearby')}
          />
        )}

      </div>
    </div>
  );
}
