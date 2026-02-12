import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { ChefHat, Loader2, AlertCircle, ArrowRight, Mail, Lock } from 'lucide-react';

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
      console.error(err);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full mb-4">
            <ChefHat className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">MahlzeitPlanner DE</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {isLogin ? 'Willkommen zurück' : 'Neues Haushaltskonto erstellen'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">E-Mail Adresse</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-900 dark:text-white"
                placeholder="name@beispiel.de"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Passwort</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-900 dark:text-white"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 transition transform active:scale-95 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Anmelden' : 'Registrieren'}
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? 'Noch kein Konto?' : 'Bereits registriert?'}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="ml-2 font-bold text-emerald-600 dark:text-emerald-400 hover:underline outline-none"
            >
              {isLogin ? 'Jetzt registrieren' : 'Anmelden'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};