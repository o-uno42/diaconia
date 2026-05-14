import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../store/AppContext';
import { t } from '../../i18n/translations';
import Button from '../ui/Button';
import logo from '../../assets/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoOpen, setDemoOpen] = useState(false);
  const { login, loading, error, user } = useAuth();
  const { state } = useAppContext();
  const navigate = useNavigate();
  const lang = state.language;
  const enableInputAutofocus = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  // Redirect if already logged in
  useEffect(() => {
    if (state.currentUser) {
      navigate(state.currentUser.role === 'admin' ? '/admin' : '/ragazzo', { replace: true });
    }
  }, [state.currentUser, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      // Navigation will be handled by the useEffect above after state update
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-ragazzo" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-300/25 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <img src={logo} alt="Diaconia" className="w-30 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-stone-800">Diaconia</h1>
          <p className="text-stone-800/50 mt-1">{t('brand_tagline', lang)}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-semibold text-stone-800 mb-6">{t('auth_login_btn', lang)}</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-stone-800/70 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@demo.it"
                required
                autoFocus={enableInputAutofocus}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-stone-800/70 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              {t('auth_login_btn', lang)}
            </Button>
          </div>
        </form>

        {/* Register link */}
        <div className="mt-4 text-center animate-slide-up" style={{ animationDelay: '150ms' }}>
          <Link to="/register" className="text-sm text-stone-800/60 hover:text-stone-800 transition-colors">
            {t('auth_no_account', lang)}
          </Link>
        </div>

        {/* Demo credentials (collapsible) */}
        <div className="mt-6 glass-card overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
          <button
            type="button"
            onClick={() => setDemoOpen((o) => !o)}
            aria-expanded={demoOpen}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <p className="text-xs font-medium text-stone-800/50 uppercase tracking-wider">{t('auth_demo_credentials', lang)}</p>
            <svg
              className={`w-5 h-5 text-stone-800 transition-transform duration-300 ${demoOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${demoOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Admin', email: 'admin@demo.it' },
                    { label: 'Mario', email: 'mario@demo.it' },
                    { label: 'Giulia', email: 'giulia@demo.it' },
                    { label: 'Ahmed', email: 'ahmed@demo.it' },
                  ].map((cred) => (
                    <button
                      key={cred.email}
                      type="button"
                      onClick={() => { setEmail(cred.email); setPassword('demo1234'); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-all border border-white/5 hover:border-white/15"
                    >
                      <span className="font-semibold text-stone-800/80">{cred.label}</span>
                      <span className="block text-stone-800/40 mt-0.5">{cred.email}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-stone-800/30 mt-2 text-center">{t('auth_demo_password_hint', lang)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
