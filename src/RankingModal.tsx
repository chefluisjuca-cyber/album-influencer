import React from 'react';
import { X, Trophy, Loader2, Medal, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, loadProfile } from './supabase';
import { TOTAL_STICKERS, SECTIONS } from './data';
import type { CollectionMap } from './supabase';

interface RankEntry {
  id: string;
  display_name: string;
  lat: number | null;
  lng: number | null;
  glued: number;
  pct: number;
  distance_km: number | null;
}

interface Props {
  userId: string;
  onClose: () => void;
}

export default function RankingModal({ userId, onClose }: Props) {
  const [entries, setEntries] = React.useState<RankEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [myRank, setMyRank] = React.useState<number | null>(null);
  const [expanded, setExpanded] = React.useState(true);

  React.useEffect(() => {
    load();
  }, [userId]);

  async function load() {
    setLoading(true);
    const myProfile = await loadProfile(userId);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,display_name,lat,lng')
      .eq('show_in_nearby', true);

    if (!profiles) { setLoading(false); return; }

    const { data: collections } = await supabase
      .from('collections')
      .select('user_id,data')
      .in('user_id', profiles.map((p: { id: string }) => p.id));

    const collMap: Record<string, CollectionMap> = {};
    (collections ?? []).forEach((c: { user_id: string; data: CollectionMap }) => {
      collMap[c.user_id] = c.data;
    });

    const R = 6371;
    const ranked: RankEntry[] = profiles.map((p: { id: string; display_name: string; lat: number | null; lng: number | null }) => {
      const coll = collMap[p.id] ?? {};
      let glued = 0;
      for (const sec of SECTIONS) {
        for (const s of sec.stickers) {
          if ((coll[sec.code]?.[s] ?? 0) >= 1) glued++;
        }
      }
      let distance_km: number | null = null;
      if (myProfile?.lat && myProfile?.lng && p.lat && p.lng) {
        const dLat = ((p.lat - myProfile.lat) * Math.PI) / 180;
        const dLng = ((p.lng - myProfile.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((myProfile.lat * Math.PI) / 180) *
          Math.cos((p.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
        distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      return {
        id: p.id,
        display_name: p.display_name || 'Colecionador',
        lat: p.lat,
        lng: p.lng,
        glued,
        pct: Math.round((glued / TOTAL_STICKERS) * 100),
        distance_km,
      };
    });

    ranked.sort((a, b) => b.pct - a.pct);

    const rank = ranked.findIndex((e) => e.id === userId);
    setMyRank(rank >= 0 ? rank + 1 : null);

    const top10 = ranked.slice(0, 10);
    if (rank >= 10) top10.push(ranked[rank]);
    setEntries(top10);

    setLoading(false);
  }

  const medalColors: Record<number, { bg: string; color: string }> = {
    1: { bg: 'rgba(251,191,36,0.18)', color: '#fbbf24' },
    2: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    3: { bg: 'rgba(180,83,9,0.15)', color: '#d97706' },
  };

  const visibleEntries = expanded ? entries : entries.slice(0, 3);
  const hasMore = entries.length > 3 || (myRank !== null && myRank > 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #251e06 0%, #0d121c 60%, #04050a 100%)',
          border: '1px solid rgba(234,179,8,0.35)',
          boxShadow: '0 20px 50px -10px rgba(234,179,8,0.2)',
          maxHeight: '88vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#b45309,#f59e0b)' }}>
              <Trophy size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Ranking</h2>
              <p className="text-xs text-slate-500">Top 10 por completude do álbum</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {myRank !== null && (
          <div className="mx-6 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Medal size={16} className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300 font-semibold">
              Você está em <span className="text-white font-extrabold">#{myRank}</span> lugar
              {entries[myRank - 1] && <span className="text-amber-500"> · {entries[myRank - 1].pct}% completo</span>}
            </p>
          </div>
        )}

        <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-2">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="text-slate-600 animate-spin" />
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="py-10 text-center">
              <Trophy size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhum colecionador visível ainda.</p>
              <p className="text-xs text-slate-700 mt-1">Ative "Aparecer na busca" no seu perfil para participar do ranking.</p>
            </div>
          )}

          {visibleEntries.map((e, i) => {
            const isMe = e.id === userId;
            const globalRank = myRank && isMe ? myRank : i + 1;
            const isSeparator = myRank && myRank > 10 && isMe;
            const badgeStyle = medalColors[globalRank] ?? { bg: 'rgba(255,255,255,0.05)', color: '#475569' };

            return (
              <React.Fragment key={e.id}>
                {isSeparator && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <span className="text-[10px] text-slate-600 font-medium">sua posição</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                )}
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                  style={{
                    background: isMe ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                    border: isMe ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-extrabold"
                    style={badgeStyle}
                  >
                    #{globalRank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: isMe ? '#fde68a' : '#e2e8f0' }}>
                      {e.display_name}{isMe && <span className="text-amber-600 ml-1.5 text-xs">(você)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${e.pct}%`, background: isMe ? '#f59e0b' : '#334155' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold" style={{ color: isMe ? '#fbbf24' : '#94a3b8' }}>{e.pct}%</p>
                    <p className="text-[10px] text-slate-700">{e.glued}/{TOTAL_STICKERS}</p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {!loading && hasMore && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white transition-all hover:bg-white/6 mt-1"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {expanded
                ? <><ChevronUp size={14} /> Recolher</>
                : <><ChevronDown size={14} /> Ver top 10</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
