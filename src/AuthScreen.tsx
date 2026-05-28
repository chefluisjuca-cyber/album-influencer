import React from 'react';
import { Trophy, BookOpen, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from './supabase';

type Mode = 'login' | 'signup' | 'reset';

interface Props { onAuth: () => void; }

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode]         = React.useState<Mode>('login');
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw]     = React.useState(false);
  const [loading, setLoading]   = React.useState(false);
  const [error, setError]       = React.useState('');
  const [success, setSuccess]   = React.useState('');

  function switchMode(m: Mode) { setMode(m); setError(''); setSuccess(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'reset') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (err) throw err;
        setSuccess('Email de redefinição enviado! Verifique sua caixa de entrada.');
        setLoading(false);
        return;
      }
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      onAuth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      if (msg.includes('Invalid login credentials'))  setError('Email ou senha incorretos.');
      else if (msg.includes('User already registered')) { setError('Este email já está cadastrado. Faça login.'); switchMode('login'); }
      else if (msg.includes('Password should be at least')) setError('A senha deve ter pelo menos 6 caracteres.');
      else setError(msg);
    } finally { setLoading(false); }
  }

  const fieldStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
  const fieldFocusStyle                 = 'focus-within:ring-2 focus-within:ring-sky-500/30';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg,#020810 0%,#071224 55%,#020810 100%)' }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex mb-5 relative">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#1e3a8a,#0369a1)', boxShadow: '0 0 40px rgba(14,165,233,0.2), 0 0 0 1px rgba(14,165,233,0.15)' }}
          >
            <Trophy size={36} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', boxShadow: '0 2px 8px rgba(251,191,36,0.4)' }}>
            <BookOpen size={12} className="text-amber-900" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
          Álbum <span style={{ background: 'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Copa 2026</span>
        </h1>
        <p className="text-slate-500 text-sm">Gerencie sua coleção na nuvem</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-7"
        style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
      >
        {mode === 'reset' ? (
          <>
            <button onClick={() => switchMode('login')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-5">
              <ArrowLeft size={12} /> Voltar para login
            </button>
            <h2 className="text-lg font-bold text-white mb-1">Recuperar senha</h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">Informe seu email e enviaremos um link para redefinir sua senha.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block mb-1.5">Email</label>
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${fieldFocusStyle}`} style={fieldStyle}>
                  <Mail size={14} className="text-slate-500 shrink-0" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600" />
                </div>
              </div>
              {error   && <Alert type="error">{error}</Alert>}
              {success && <Alert type="success">{success}</Alert>}
              <button type="submit" disabled={loading || !!success}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:scale-100"
                style={{ background: 'linear-gradient(135deg,#1e40af,#0284c7)' }}>
                {loading && <Loader2 size={15} className="animate-spin" />}
                Enviar link de recuperação
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
              {(['login', 'signup'] as const).map((m) => (
                <button key={m} onClick={() => switchMode(m)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={mode === m ? { background: 'linear-gradient(135deg,#1e40af,#0284c7)', color: '#fff' } : { color: '#64748b' }}>
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block mb-1.5">Email</label>
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${fieldFocusStyle}`} style={fieldStyle}>
                  <Mail size={14} className="text-slate-500 shrink-0" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Senha</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => switchMode('reset')} className="text-xs text-sky-500 hover:text-sky-400 transition-colors">
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${fieldFocusStyle}`} style={fieldStyle}>
                  <Lock size={14} className="text-slate-500 shrink-0" />
                  <input type={showPw ? 'text' : 'password'} required minLength={6} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="text-slate-600 hover:text-slate-400 transition-colors">
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {error && <Alert type="error">{error}</Alert>}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:scale-100"
                style={{ background: 'linear-gradient(135deg,#1e40af,#0284c7)', boxShadow: '0 4px 20px rgba(2,132,199,0.25)' }}>
                {loading && <Loader2 size={15} className="animate-spin" />}
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-600 mt-5">
              {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
                {mode === 'login' ? 'Criar conta' : 'Entrar'}
              </button>
            </p>
          </>
        )}
      </div>

      <p className="text-xs text-slate-700 mt-6 text-center max-w-xs">Sua coleção fica salva na nuvem e pode ser acessada em qualquer dispositivo.</p>
    </div>
  );
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  const styles = {
    error:   { background: 'rgba(244,63,94,0.08)',   color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)'  },
    success: { background: 'rgba(16,185,129,0.08)',  color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' },
  }[type];
  return (
    <p className="text-xs rounded-xl px-3 py-2.5 leading-relaxed" style={styles}>{children}</p>
  );
}
