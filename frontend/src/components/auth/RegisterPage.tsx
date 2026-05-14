import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../store/AppContext';
import { t } from '../../i18n/translations';
import Button from '../ui/Button';
import logo from '../../assets/logo.png';

export default function RegisterPage() {
  const [role, setRole] = useState<'admin' | 'ragazzo'>('admin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, loading, error, user } = useAuth();
  const { state } = useAppContext();
  const navigate = useNavigate();
  const lang = state.language;
  const enableInputAutofocus = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/ragazzo', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== passwordConfirm) {
      setLocalError(t('auth_passwords_mismatch', lang));
      return;
    }

    const result = await register(email, password, firstName, lastName, role);
    if (result.success) {
      setSuccess(true);
    }
  };

  const displayError = localError ?? error;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-ragazzo" />
        <div className="relative w-full max-w-md text-center glass-card p-10 animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Controlla la tua email!</h2>
          <p className="text-stone-800/60 mb-6 text-sm">
            Abbiamo inviato un codice OTP a <span className="font-medium text-stone-800">{email}</span>.<br />
            Confermalo per attivare il tuo account.
          </p>
          <Link to="/login" className="btn-primary inline-block px-6 py-2 rounded-xl text-sm font-medium">
            {t('auth_login_btn', lang)}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-ragazzo" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-300/25 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <img src={logo} alt="Diaconia" className="w-30 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-stone-800">Diaconia</h1>
          <p className="text-stone-800/50 mt-1">{t('brand_tagline', lang)}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-semibold text-stone-800 mb-6">{t('auth_register', lang)}</h2>

          {displayError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in">
              {displayError}
            </div>
          )}

          <div className="space-y-4">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2">
              {(['admin', 'ragazzo'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    role === r
                      ? 'bg-amber-500/20 border-amber-500/40 text-stone-800'
                      : 'bg-white/5 border-white/10 text-stone-800/50 hover:bg-white/10'
                  }`}
                >
                  {r === 'admin' ? t('role_admin', lang) : t('role_ragazzo', lang)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first-name" className="block text-sm font-medium text-stone-800/70 mb-1.5">
                  {t('auth_first_name', lang)}
                </label>
                <input
                  id="reg-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Mario"
                  required
                  autoFocus={enableInputAutofocus}
                />
              </div>
              <div>
                <label htmlFor="reg-last-name" className="block text-sm font-medium text-stone-800/70 mb-1.5">
                  {t('auth_last_name', lang)}
                </label>
                <input
                  id="reg-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Rossi"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-stone-800/70 mb-1.5">Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="mario@esempio.it"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('auth_password', lang)}
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="reg-password-confirm" className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('auth_password_confirm', lang)}
              </label>
              <input
                id="reg-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              {loading ? t('auth_registering', lang) : t('auth_register_btn', lang)}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Link to="/login" className="text-sm text-stone-800/60 hover:text-stone-800 transition-colors">
            {t('auth_already_account', lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}
