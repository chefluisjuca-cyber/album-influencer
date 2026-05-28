import React from 'react';
import { X, User, MapPin, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase, loadProfile, saveProfile, geocodeCep, type Profile } from './supabase';

const GLASS = { background: 'rgba(0,50,18,0.55)', border: '1px solid rgba(0,200,80,0.12)' };
const GREEN_GRAD = 'linear-gradient(135deg,#14532d,#15803d)';

interface Props {
  userId: string;
  onClose: () => void;
}

export default function ProfileModal({ userId, onClose }: Props) {
  const [profile, setProfile] = React.useState<Profile>({
    id: userId,
    display_name: '',
    cep: '',
    lat: null,
    lng: null,
    show_in_nearby: true,
    whatsapp: '',
    accepts_trades: true,
    contact_info: '',
    is_premium: false,
  });
  const [loading, setLoading]     = React.useState(true);
  const [saving, setSaving]       = React.useState(false);
  const [geocoding, setGeocoding] = React.useState(false);
  const [success, setSuccess]     = React.useState(false);
  const [error, setError]         = React.useState('');
  const [postalInput, setPostalInput] = React.useState('');

  React.useEffect(() => {
    loadProfile(userId).then((p) => {
      if (p) { setProfile(p); setPostalInput(p.cep); }
      setLoading(false);
    });
  }, [userId]);

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const prevVal = profile.whatsapp;
    const isDeleting = inputVal.length < prevVal.length;

    let formatted = inputVal;

    if (!isDeleting) {
      const clean = inputVal.replace(/[^\d+]/g, '');

      if (clean.startsWith('+') && !clean.startsWith('+55')) {
        // Keep international format raw or as typed
        formatted = inputVal;
      } else if (clean.startsWith('+55')) {
        const rawNum = clean.slice(3).replace(/\D/g, ''); // digits after +55
        if (rawNum.length === 2) {
          formatted = `+55 ${rawNum} `;
        } else if (rawNum.length > 2) {
          const ddd = rawNum.slice(0, 2);
          const rest = rawNum.slice(2);
          if (rest.length <= 5) {
            formatted = `+55 ${ddd} ${rest}`;
          } else {
            const part1 = rest.slice(0, 5);
            const part2 = rest.slice(5, 9);
            formatted = `+55 ${ddd} ${part1}-${part2}`;
          }
        } else if (rawNum.length > 0) {
          formatted = `+55 ${rawNum}`;
        } else {
          formatted = `+55 `;
        }
      } else if (clean.startsWith('55') && clean.length > 2) {
        const rawNum = clean.slice(2).replace(/\D/g, ''); // digits after 55
        if (rawNum.length === 2) {
          formatted = `+55 ${rawNum} `;
        } else if (rawNum.length > 2) {
          const ddd = rawNum.slice(0, 2);
          const rest = rawNum.slice(2);
          if (rest.length <= 5) {
            formatted = `+55 ${ddd} ${rest}`;
          } else {
            const part1 = rest.slice(0, 5);
            const part2 = rest.slice(5, 9);
            formatted = `+55 ${ddd} ${part1}-${part2}`;
          }
        } else if (rawNum.length > 0) {
          formatted = `+55 ${rawNum}`;
        } else {
          formatted = `+55 `;
        }
      } else {
        const digits = clean.replace(/\D/g, '');
        if (digits.length === 2) {
          formatted = `${digits} `;
        } else if (digits.length > 2) {
          const ddd = digits.slice(0, 2);
          const rest = digits.slice(2);
          if (rest.length <= 5) {
            formatted = `${ddd} ${rest}`;
          } else {
            const part1 = rest.slice(0, 5);
            const part2 = rest.slice(5, 9);
            formatted = `${ddd} ${part1}-${part2}`;
          }
        }
      }
    } else {
      if (prevVal.endsWith(' ') && inputVal === prevVal.slice(0, -1)) {
        formatted = inputVal.slice(0, -1);
      }
    }

    setProfile((p) => ({ ...p, whatsapp: formatted }));
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!profile.whatsapp.trim()) {
      setError('WhatsApp é obrigatório para o compartilhamento de trocas.');
      return;
    }

    setSaving(true);
    try {
      let lat = profile.lat;
      let lng = profile.lng;
      const trimmed = postalInput.trim();

      if (trimmed && trimmed !== profile.cep) {
        setGeocoding(true);
        const coords = await geocodeCep(trimmed);
        setGeocoding(false);
        if (!coords) {
          setError('Código postal não encontrado. Verifique e tente novamente.');
          setSaving(false);
          return;
        }
        lat = coords.lat;
        lng = coords.lng;
      }

      const updated: Profile = { ...profile, cep: trimmed, lat, lng };
      await saveProfile(updated);
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
      setGeocoding(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Tem certeza? Sua conta e coleção serão excluídos permanentemente.')) return;
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <Loader2 size={28} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #022312 0%, #02120b 60%, #010806 100%)',
          border: '1px solid rgba(16,185,129,0.35)',
          boxShadow: '0 20px 50px -10px rgba(16,185,129,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(0,200,80,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: GREEN_GRAD }}>
              <User size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Meu Perfil</h2>
              <p className="text-xs text-slate-500">Nome, WhatsApp e localização</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 pb-6 pt-5 space-y-4">

          {/* Display name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Nome para exibição
            </label>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={GLASS}>
              <User size={14} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                placeholder="Como quer aparecer para outros colecionadores"
                maxLength={40}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
              />
            </div>
          </div>

          {/* WhatsApp — obrigatório */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              WhatsApp <span className="text-emerald-500 font-bold">*</span>
            </label>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{
                ...GLASS,
                border: !profile.whatsapp.trim() && error ? '1px solid rgba(244,63,94,0.5)' : GLASS.border,
              }}
            >
              <Phone size={14} className="text-emerald-500 shrink-0" />
              <input
                type="tel"
                value={profile.whatsapp}
                onChange={handleWhatsAppChange}
                placeholder="+55 (11) 99999-9999"
                maxLength={25}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Obrigatorio — usado para contato ao aceitar trocas. Visível apenas para quem você aceitar.
            </p>
          </div>

          {/* Código postal (CEP ou internacional) */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Código Postal / CEP
            </label>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={GLASS}>
              <MapPin size={14} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={postalInput}
                onChange={(e) => setPostalInput(e.target.value)}
                placeholder="00000-000 ou código postal do seu país"
                maxLength={12}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600 font-mono"
              />
              {geocoding && <Loader2 size={13} className="text-emerald-400 animate-spin shrink-0" />}
              {profile.lat && !geocoding && <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Aceita CEP brasileiro (00000-000) ou código postal de qualquer país. Usado para encontrar colecionadores próximos — nunca exibido.
            </p>
          </div>

          {/* Aparecer na busca / Ranking (show_in_nearby) */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-xl" style={GLASS}>
            <div className="flex-1">
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                Aparecer na busca e no ranking
              </label>
              <p className="text-[11px] text-slate-500 leading-normal">
                Permite que outros colecionadores vejam seu progresso no ranking e encontrem você para trocas de figurinhas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProfile((p) => ({ ...p, show_in_nearby: !p.show_in_nearby }))}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                profile.show_in_nearby ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  profile.show_in_nearby ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Aceitar propostas de trocas (accepts_trades) */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-xl" style={GLASS}>
            <div className="flex-1">
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                Aceitar propostas de trocas
              </label>
              <p className="text-[11px] text-slate-500 leading-normal">
                Permite que outros usuários enviem mensagens e propostas de trocas de figurinhas para você.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProfile((p) => ({ ...p, accepts_trades: !p.accepts_trades }))}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                profile.accepts_trades ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  profile.accepts_trades ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="text-xs rounded-xl px-3 py-2.5" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 size={13} /> Perfil salvo com sucesso!
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:scale-100"
            style={{ background: GREEN_GRAD }}
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? (geocoding ? 'Localizando código postal...' : 'Salvando...') : 'Salvar perfil'}
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full py-2 text-xs text-slate-700 hover:text-rose-500 transition-colors"
          >
            Excluir minha conta
          </button>
        </form>
      </div>
    </div>
  );
}
