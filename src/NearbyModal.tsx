import React from 'react';
import {
  X, MapPin, Users, Loader2, ArrowLeftRight, RefreshCw,
  CheckCircle2, SlidersHorizontal, Search,
} from 'lucide-react';
import { supabase, findNearbyUsers, loadProfile, type NearbyUser } from './supabase';
import type { CollectionMap } from './supabase';
import { SECTIONS } from './data';

interface Props {
  userId: string;
  collection: CollectionMap;
  onClose: () => void;
  onOpenProfile: () => void;
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

function missingStickers(collection: CollectionMap): { sectionCode: string; stickerId: string; label: string }[] {
  const missing: { sectionCode: string; stickerId: string; label: string }[] = [];
  for (const sec of SECTIONS) {
    for (const s of sec.stickers) {
      if ((collection[sec.code]?.[s] ?? 0) === 0) {
        missing.push({ sectionCode: sec.code, stickerId: s, label: `${sec.name} · ${s}` });
      }
    }
  }
  return missing;
}

function analyzePossibleTrades(mine: CollectionMap, theirs: CollectionMap) {
  let give = 0, receive = 0;
  for (const sec of SECTIONS) {
    for (const s of sec.stickers) {
      const my = mine[sec.code]?.[s] ?? 0;
      const th = theirs[sec.code]?.[s] ?? 0;
      if (my > 1 && th === 0) give++;
      if (th > 1 && my === 0) receive++;
    }
  }
  return { give, receive };
}

function hasStickerAvailable(theirs: CollectionMap, sectionCode: string, stickerId: string) {
  return (theirs[sectionCode]?.[stickerId] ?? 0) > 1;
}

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function NearbyModal({ userId, collection, onClose, onOpenProfile }: Props) {
  const [radius, setRadius]           = React.useState(25);
  const [users, setUsers]             = React.useState<NearbyUser[]>([]);
  const [userCollections, setUserCollections] = React.useState<Record<string, CollectionMap>>({});
  const [loading, setLoading]         = React.useState(false);
  const [hasLocation, setHasLocation] = React.useState<boolean | null>(null);
  const [searched, setSearched]       = React.useState(false);

  // Filter state
  const [showFilter, setShowFilter]   = React.useState(false);
  const [filterSticker, setFilterSticker] = React.useState<{ sectionCode: string; stickerId: string } | null>(null);
  const [stickerSearch, setStickerSearch] = React.useState('');

  const collectionUrl = `${window.location.origin}${window.location.pathname}?uid=${userId}`;
  const missing = React.useMemo(() => missingStickers(collection), [collection]);

  const filteredMissing = React.useMemo(() => {
    if (!stickerSearch.trim()) return missing.slice(0, 80);
    const q = stickerSearch.toLowerCase();
    return missing.filter((m) => m.label.toLowerCase().includes(q) || m.stickerId.toLowerCase().includes(q)).slice(0, 80);
  }, [missing, stickerSearch]);

  React.useEffect(() => {
    loadProfile(userId).then((p) => {
      setHasLocation(!!(p?.lat && p?.lng && p?.show_in_nearby));
    });
  }, [userId]);

  async function search() {
    try {
      const profile = await loadProfile(userId);
      if (!profile?.lat || !profile?.lng) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      const found = await findNearbyUsers(profile.lat, profile.lng, radius);
      const nearby = found.filter((u) => u.id !== userId);
      setUsers(nearby);

      if (nearby.length > 0) {
        const userIds = nearby.map((u) => u.id);
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('user_id, data')
          .in('user_id', userIds);

        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
        }

        const collMap: Record<string, CollectionMap> = {};
        if (collectionsData) {
          collectionsData.forEach((c) => {
            collMap[c.user_id] = (c.data as CollectionMap) ?? {};
          });
        }
        setUserCollections(collMap);
      } else {
        setUserCollections({});
      }
    } catch (err) {
      console.error('Error in search:', err);
    } finally {
      setLoading(false);
    }
  }

  const visibleUsers = React.useMemo(() => {
    if (!filterSticker) return users;
    return users.filter((u) => {
      const coll = userCollections[u.id];
      if (!coll) return false;
      return hasStickerAvailable(coll, filterSticker.sectionCode, filterSticker.stickerId);
    });
  }, [users, userCollections, filterSticker]);

  const tradeableVisible = visibleUsers.filter((u) => u.accepts_trades);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #0e1e38 0%, #071126 60%, #030614 100%)',
          border: '1px solid rgba(59,130,246,0.3)',
          boxShadow: '0 20px 50px -10px rgba(59,130,246,0.3)',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Colecionadores Próximos</h2>
              <p className="text-xs text-slate-500">Envie uma proposta de troca pelo WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-4">
          {/* No location */}
          {hasLocation === false && (
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <MapPin size={24} className="text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-amber-300 mb-1">Configure seu CEP primeiro</p>
              <p className="text-xs text-slate-400 mb-3">Para aparecer na busca e encontrar outros colecionadores, cadastre seu CEP e ative a visibilidade no seu perfil.</p>
              <button
                onClick={() => { onClose(); onOpenProfile(); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}
              >
                Configurar perfil
              </button>
            </div>
          )}

          {hasLocation === true && (
            <>
              {/* Radius selector */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Distância máxima
                </label>
                <div className="flex gap-2 flex-wrap">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={
                        radius === r
                          ? { background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={search}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100"
                style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                {loading ? 'Buscando...' : 'Buscar colecionadores'}
              </button>

              {/* Sticker filter */}
              {searched && !loading && users.length > 0 && (
                <div>
                  <button
                    onClick={() => { setShowFilter((v) => !v); setStickerSearch(''); }}
                    className="w-full flex items-center justify-between rounded-2xl px-4 py-3 transition-all"
                    style={{
                      background: filterSticker ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.04)',
                      border: filterSticker ? '1px solid rgba(14,165,233,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={14} className={filterSticker ? 'text-sky-400' : 'text-slate-500'} />
                      <span className={`text-sm font-semibold ${filterSticker ? 'text-sky-300' : 'text-slate-400'}`}>
                        {filterSticker ? `Filtrando por: ${filterSticker.stickerId}` : 'Filtrar por figurinha específica'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {filterSticker && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setFilterSticker(null); }}
                          className="text-xs text-slate-500 hover:text-rose-400 transition-colors px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          Limpar
                        </span>
                      )}
                      <X size={13} className={`transition-transform text-slate-600 ${showFilter ? 'rotate-0' : 'rotate-45'}`} />
                    </div>
                  </button>

                  {showFilter && (
                    <div className="mt-2 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="px-3 pt-3 pb-2">
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <Search size={12} className="text-slate-500 shrink-0" />
                          <input
                            type="text"
                            value={stickerSearch}
                            onChange={(e) => setStickerSearch(e.target.value)}
                            placeholder="Buscar figurinha (ex: BRA, FWC3...)"
                            className="flex-1 bg-transparent text-white text-xs outline-none placeholder-slate-600"
                            autoFocus
                          />
                          {stickerSearch && (
                            <button onClick={() => setStickerSearch('')}>
                              <X size={11} className="text-slate-500 hover:text-slate-300" />
                            </button>
                          )}
                        </div>
                      </div>
                      {missing.length === 0 && (
                        <p className="px-4 py-3 text-xs text-slate-500">Você não tem nenhuma figurinha faltando!</p>
                      )}
                      <div className="max-h-48 overflow-y-auto px-2 pb-2 space-y-0.5">
                        {filteredMissing.map((m) => (
                          <button
                            key={`${m.sectionCode}-${m.stickerId}`}
                            onClick={() => { setFilterSticker({ sectionCode: m.sectionCode, stickerId: m.stickerId }); setShowFilter(false); setStickerSearch(''); }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all hover:bg-white/8 flex items-center justify-between group"
                            style={
                              filterSticker?.stickerId === m.stickerId && filterSticker?.sectionCode === m.sectionCode
                                ? { background: 'rgba(14,165,233,0.12)', color: '#7dd3fc' }
                                : { color: '#94a3b8' }
                            }
                          >
                            <span><span className="font-mono font-semibold text-white">{m.stickerId}</span> · {m.label.split(' · ')[0]}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-400 text-[10px]">filtrar</span>
                          </button>
                        ))}
                        {filteredMissing.length === 0 && stickerSearch && (
                          <p className="px-3 py-2 text-xs text-slate-600">Nenhuma figurinha encontrada.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {searched && !loading && users.length === 0 && (
                <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Users size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhum colecionador encontrado em {radius} km.</p>
                  <p className="text-xs text-slate-600 mt-1">Tente aumentar o raio de busca.</p>
                </div>
              )}

              {/* Filter empty state */}
              {searched && !loading && users.length > 0 && filterSticker && visibleUsers.length === 0 && (
                <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <ArrowLeftRight size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhum colecionador próximo tem <span className="font-mono text-white">{filterSticker.stickerId}</span> sobrando.</p>
                  <p className="text-xs text-slate-600 mt-1">Tente outra figurinha ou aumente o raio.</p>
                </div>
              )}

              {/* User list */}
              {visibleUsers.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    <span className="text-white font-semibold">{visibleUsers.length}</span> colecionador{visibleUsers.length !== 1 ? 'es' : ''}
                    {filterSticker
                      ? <span className="text-sky-400"> têm <span className="font-mono font-semibold">{filterSticker.stickerId}</span> sobrando</span>
                      : <span> em até {radius} km</span>
                    }
                    {tradeableVisible.length > 0 && (
                      <span className="text-emerald-400 ml-2">· {tradeableVisible.length} aceitam propostas</span>
                    )}
                  </p>

                  {visibleUsers.map((u) => (
                    <NearbyUserCard
                      key={u.id}
                      user={u}
                      theirCollection={userCollections[u.id] ?? null}
                      myCollection={collection}
                      filterSticker={filterSticker}
                      collectionUrl={collectionUrl}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {hasLocation === null && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-slate-600 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NearbyUserCard({
  user,
  theirCollection,
  myCollection,
  filterSticker,
  collectionUrl,
}: {
  user: NearbyUser;
  theirCollection: CollectionMap | null;
  myCollection: CollectionMap;
  filterSticker: { sectionCode: string; stickerId: string } | null;
  collectionUrl: string;
}) {
  const [sending, setSending] = React.useState(false);
  const [sent, setSent]       = React.useState(false);

  const tradeInfo = React.useMemo(() => {
    if (!theirCollection) return null;
    return analyzePossibleTrades(myCollection, theirCollection);
  }, [theirCollection, myCollection]);

  const dist = typeof user.distance_km === 'number' && !isNaN(user.distance_km)
    ? (user.distance_km < 1
        ? `${Math.round(user.distance_km * 1000)} m`
        : `${user.distance_km.toFixed(1)} km`)
    : 'N/A';

  async function handleWhatsApp() {
    if (!user.whatsapp || sending) return;
    setSending(true);

    let text = `Olá${user.display_name ? ' ' + user.display_name : ''}!\n`;
    text += `Vi que você está próximo e aceita trocas de figurinhas da Copa 2026.\n`;
    if (tradeInfo && (tradeInfo.give > 0 || tradeInfo.receive > 0)) {
      if (tradeInfo.give > 0) text += `Posso te dar: ${tradeInfo.give} figurinha(s) que você não tem.\n`;
      if (tradeInfo.receive > 0) text += `Você pode me dar: ${tradeInfo.receive} que eu preciso.\n`;
    }
    text += `Veja minha coleção: ${collectionUrl}`;

    const phone = user.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    setSent(true);
    setSending(false);
  }

  const canTrade = user.accepts_trades && !!user.whatsapp;

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: sent ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.04)',
        border: sent ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">
              {user.display_name || 'Colecionador'}
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.2)' }}>
              <MapPin size={10} className="inline mr-1" />{dist}
            </span>
            {user.accepts_trades && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                <ArrowLeftRight size={9} className="inline mr-1" />aceita propostas
              </span>
            )}
          </div>

          {/* Filter match highlight */}
          {filterSticker && theirCollection && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.15)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)' }}>
                <CheckCircle2 size={9} className="inline mr-1" />
                tem <span className="font-mono">{filterSticker.stickerId}</span> sobrando
              </span>
            </div>
          )}

          {/* Trade analysis */}
          {theirCollection && tradeInfo && (tradeInfo.give > 0 || tradeInfo.receive > 0) && (
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {tradeInfo.give > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                  dou {tradeInfo.give}
                </span>
              )}
              {tradeInfo.receive > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                  recebo {tradeInfo.receive}
                </span>
              )}
            </div>
          )}

          {!theirCollection && (
            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Analisando trocas...
            </p>
          )}

          {theirCollection && tradeInfo && tradeInfo.give === 0 && tradeInfo.receive === 0 && !filterSticker && (
            <p className="text-xs text-slate-600 mt-1">Nenhuma troca possível no momento.</p>
          )}
        </div>

        {/* WhatsApp button */}
        {canTrade && (
          <button
            onClick={handleWhatsApp}
            disabled={sending}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
            style={
              sent
                ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }
                : { background: 'linear-gradient(135deg,#15803d,#22c55e)', color: '#fff' }
            }
          >
            {sent
              ? <><CheckCircle2 size={13} /> Enviado</>
              : <><WhatsAppIcon size={13} /> Proposta</>
            }
          </button>
        )}

        {!canTrade && (
          <span className="shrink-0 text-xs text-slate-600 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            sem contato
          </span>
        )}
      </div>
    </div>
  );
}
