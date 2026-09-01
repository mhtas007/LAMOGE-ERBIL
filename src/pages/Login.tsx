import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Lock, ArrowRight, Mail } from 'lucide-react';
import { Language } from '../types';

export const Login: React.FC = () => {
  const { login, t, language, setLanguage, isRtl } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setLoading(true);
      const success = await login(email, password);
      setLoading(false);
      if (!success) {
        setError(true);
      }
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-natural-text">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-32 h-32 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-md overflow-hidden bg-natural-surface mb-8 border border-natural-border/50">
          <img src="https://zoophagous-red-iaz14a7ary.edgeone.app/logo3331.png" alt="Logo" className="w-24 h-24 object-contain" />
        </div>
        <h2 className="text-center text-3xl sm:text-4xl font-light tracking-tight text-natural-dark">
          MAS POS
        </h2>
        <p className="mt-3 text-center text-sm font-medium text-natural-text-secondary">
          {t('loginToAccount')}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-natural-surface py-10 px-6 shadow-xl shadow-natural-dark/5 sm:rounded-[2rem] sm:px-12 border border-natural-border/60">
          <div className="mb-8 flex justify-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-natural-bg border border-natural-border/50 text-xs font-bold text-natural-text-secondary rounded-xl px-4 py-2 cursor-pointer outline-none focus:border-natural-accent transition-colors"
            >
              <option value="en">EN</option>
              <option value="ku">KU</option>
              <option value="ar">AR</option>
            </select>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-natural-text mb-2">
                Email
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                  <Mail className="h-5 w-5 text-natural-text-tertiary" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(false);
                  }}
                  className={`block w-full rounded-2xl border border-natural-border py-4 text-natural-text shadow-sm placeholder:text-natural-text-tertiary/50 focus:border-natural-accent focus:ring-0 sm:text-sm bg-natural-bg transition-all ${isRtl ? 'pr-12' : 'pl-12'}`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-natural-text mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                  <Lock className="h-5 w-5 text-natural-text-tertiary" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className={`block w-full rounded-2xl border border-natural-border py-4 text-natural-text shadow-sm placeholder:text-natural-text-tertiary/50 focus:border-natural-accent focus:ring-0 sm:text-sm bg-natural-bg transition-all ${isRtl ? 'pr-12' : 'pl-12'}`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium text-center bg-red-50 py-3 rounded-2xl border border-red-100">
                {t('invalidCredentials')}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-transparent rounded-2xl shadow-md text-sm font-black text-natural-dark bg-natural-accent hover:bg-[#b89574] hover:-translate-y-0.5 focus:outline-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 uppercase tracking-widest"
              >
                {loading ? '...' : t('login')}
                <ArrowRight className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
