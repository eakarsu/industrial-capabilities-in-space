import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Moon } from 'lucide-react';

export default function Login() {
  const [demoAvailable, setDemoAvailable] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { api.demoAvailability().then((status) => setDemoAvailable(status.available)).catch(() => setDemoAvailable(false)); }, []);

  const finishSignIn = (res: { token: string; user: unknown }) => {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    navigate('/print_jobs');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.login(email, password);
      finishSignIn(res);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Login failed'); }
    finally { setLoading(false); }
  };

  const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;

  const handleDemoFill = async () => {
    if (demoEmail && demoPassword) { setEmail(demoEmail); setPassword(demoPassword); return; }
    try {
      const res = await fetch('/api/auth/demo-credentials', { cache: 'no-store' });
      if (res.ok) { const data = await res.json(); if (data.email && data.password) { setEmail(data.email); setPassword(data.password); return; } }
    } catch { /* fallback below */ }
    setError('Demo credentials are not configured for this environment.');
  };

  const handleDemoSignIn = async () => {
    setLoading(true); setError('');
    try { finishSignIn(await api.demoLogin()); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Demo sign-in failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" style={{backgroundImage:'radial-gradient(ellipse at center, #0a0f1e 0%, #000000 100%)'}}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-blue-500 flex items-center justify-center">
            <Moon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">LunarBase</h1>
            <p className="text-gray-400 text-sm">Lunar Industrial Operations</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Mission Control Access</h2>
          <form id="lf" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
                type="button"
                onClick={handleDemoFill}
                aria-label="Fill demo credentials"
                style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
              >
                Fill demo credentials
              </button>
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={!demoAvailable || loading}
              aria-label="Sign in with configured demo account"
              style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
            >
              Sign in with demo account
            </button>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500">{demoAvailable ? 'Uses the configured local demo account.' : 'Local demo sign-in is unavailable. Accounts and base access are provisioned by mission operations.'}</p>
        </div>
      </div>
    </div>
  );
}
