import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../store/AppContext';
import Button from '../ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, user } = useAuth();
  const { state } = useAppContext();
  const navigate = useNavigate();

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
      <div className="absolute inset-0 gradient-admin" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-600/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-accent flex items-center justify-center mb-4 shadow-glow-indigo">
            <span className="text-4xl font-bold text-white">D</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Diaconia</h1>
          <p className="text-white/50 mt-1">Case Management Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-semibold text-white mb-6">Accedi</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@demo.it"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
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
              Accedi
            </Button>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 glass-card p-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Credenziali demo</p>
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
                <span className="font-semibold text-white/80">{cred.label}</span>
                <span className="block text-white/40 mt-0.5">{cred.email}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/30 mt-2 text-center">Password: demo1234</p>
        </div>
      </div>
    </div>
  );
}
