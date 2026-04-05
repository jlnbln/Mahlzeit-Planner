import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2, AlertCircle, ArrowRight, ChefHat } from 'lucide-react';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-parchment dark:bg-[#131912] flex items-center justify-center p-5 transition-colors duration-200">

      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-forest-100 dark:bg-[rgba(79,196,117,0.06)] opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-clay-100 dark:bg-[rgba(160,140,100,0.06)] opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">

        {/* Card */}
        <div className="card p-8">

          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-forest-500 dark:bg-[#4FC475] rounded-2xl flex items-center justify-center shadow-btn-forest mb-4">
              <ChefHat className="h-8 w-8 text-white dark:text-[#071B10]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#1C1A16] dark:text-[#F0EDE5]">
              MahlzeitPlanner
            </h1>
            <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] mt-1.5">
              {isLogin ? 'Willkommen zurück' : 'Neues Haushaltskonto erstellen'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-xl flex items-start gap-2.5 text-red-700 dark:text-red-400 text-sm animate-slide-up">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">
                E-Mail Adresse
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="name@beispiel.de"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">
                Passwort
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Anmelden' : 'Registrieren'}
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-sm text-[#6E6A60] dark:text-[#9A9690]">
            {isLogin ? 'Noch kein Konto?' : 'Bereits registriert?'}
            {' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="font-semibold text-forest-500 dark:text-[#4FC475] hover:underline outline-none"
            >
              {isLogin ? 'Jetzt registrieren' : 'Anmelden'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-clay-400 dark:text-[#6B6762] mt-6">
          KI-gestützter Mahlzeitplaner für deinen Haushalt
        </p>
      </div>
    </div>
  );
};
