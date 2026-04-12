import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2, AlertCircle, ArrowRight, Mail, Lock, Eye, EyeOff, ChefHat } from 'lucide-react';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let msg = "Ein Fehler ist aufgetreten.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = "E-Mail oder Passwort falsch.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "Diese E-Mail wird bereits verwendet.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Das Passwort muss mindestens 6 Zeichen lang sein.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Ungültiges E-Mail-Format.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        backgroundColor: 'var(--c-bg)',
        backgroundImage: 'radial-gradient(at 100% 0%, rgba(184,253,75,0.18) 0px, transparent 60%), radial-gradient(at 0% 100%, rgba(184,253,75,0.06) 0px, transparent 60%)',
      }}
    >
      <div className="w-full flex flex-col min-h-screen">

        {/* Logo / Brand */}
        <div className="flex flex-col items-center text-center pt-16 pb-10 px-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: '#b8fd4b', boxShadow: '0 16px 40px rgba(184,253,75,0.40)' }}
          >
            <ChefHat className="h-9 w-9" style={{ color: '#3d5e00' }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--c-text)', letterSpacing: '-0.03em' }}>
            MahlzeitPlanner
          </h1>
          <p className="mt-1.5 font-medium" style={{ color: 'var(--c-text-mid)', fontSize: '1rem' }}>
            {isLogin ? 'Willkommen zurück in deiner Küche.' : 'Erstelle dein Haushaltskonto.'}
          </p>
        </div>

        {/* Main content */}
        <main className="flex-grow w-full px-6 max-w-lg mx-auto space-y-7">

          {/* Auth Toggle */}
          <div
            className="flex items-center p-1.5 rounded-full"
            style={{ background: 'var(--c-surface-low)' }}
          >
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className="flex-1 py-2.5 text-sm font-bold rounded-full transition-all"
              style={isLogin
                ? { background: 'var(--c-surface)', color: 'var(--c-primary)', boxShadow: '0 1px 4px rgba(44,48,43,0.1)' }
                : { background: 'transparent', color: 'var(--c-text-mid)' }
              }
            >
              Anmelden
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className="flex-1 py-2.5 text-sm font-bold rounded-full transition-all"
              style={!isLogin
                ? { background: 'var(--c-surface)', color: 'var(--c-primary)', boxShadow: '0 1px 4px rgba(44,48,43,0.1)' }
                : { background: 'transparent', color: 'var(--c-text-mid)' }
              }
            >
              Registrieren
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="p-3.5 rounded-2xl flex items-start gap-2.5 text-sm animate-slide-up"
              style={{ background: '#f9dedc', color: '#410e0b', border: '1px solid rgba(179,38,30,0.2)' }}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-text-dim)', marginLeft: '0.25rem' }}>
                E-Mail Adresse
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--c-text-dim)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hallo@deinplaner.de"
                  className="w-full rounded-full py-4 pl-12 pr-5 text-base font-medium transition-all outline-none"
                  style={{
                    background: 'var(--c-surface)',
                    border: '2px solid transparent',
                    color: 'var(--c-text)',
                    boxShadow: '0 1px 4px rgba(44,48,43,0.06)',
                  }}
                  onFocus={e => {
                    e.target.style.border = '2px solid #b8fd4b';
                    e.target.style.boxShadow = '0 0 0 4px rgba(184,253,75,0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.border = '2px solid transparent';
                    e.target.style.boxShadow = '0 1px 4px rgba(44,48,43,0.06)';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-text-dim)' }}>
                  Passwort
                </label>
                {isLogin && (
                  <button type="button" className="text-xs font-bold" style={{ color: 'var(--c-primary)' }}>
                    Vergessen?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--c-text-dim)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded-full py-4 pl-12 pr-14 text-base font-medium transition-all outline-none"
                  style={{
                    background: 'var(--c-surface)',
                    border: '2px solid transparent',
                    color: 'var(--c-text)',
                    boxShadow: '0 1px 4px rgba(44,48,43,0.06)',
                  }}
                  onFocus={e => {
                    e.target.style.border = '2px solid #b8fd4b';
                    e.target.style.boxShadow = '0 0 0 4px rgba(184,253,75,0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.border = '2px solid transparent';
                    e.target.style.boxShadow = '0 1px 4px rgba(44,48,43,0.06)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--c-text-dim)' }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 font-extrabold py-5 rounded-full text-base transition-all disabled:opacity-70 active:scale-[0.98]"
              style={{
                background: '#b8fd4b',
                color: '#3d5e00',
                boxShadow: '0 12px 32px rgba(184,253,75,0.45)',
              }}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin-slow" />
              ) : (
                <>
                  <span>{isLogin ? 'Jetzt Anmelden' : 'Konto erstellen'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </main>

        {/* Footer */}
        <footer className="pb-10 pt-4 px-8">
          <p className="text-center text-xs font-medium leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--c-text-dim)' }}>
            KI-gestützter Mahlzeitplaner für deinen Haushalt.
          </p>
        </footer>
      </div>
    </div>
  );
};
