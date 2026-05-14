import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Moon } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.login(email, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      navigate('/bases');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Login failed'); }
    finally { setLoading(false); }
  };

  const demoLogin = () => {
    setEmail('admin@demo.com'); setPassword('demo123');
    setTimeout(() => document.getElementById('lf')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })), 50);
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
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Authenticating...' : 'Access Terminal'}
            </button>
          </form>
          <button onClick={demoLogin} className="w-full mt-3 border border-gray-700 hover:border-gray-600 text-gray-300 font-medium py-2.5 rounded-lg transition-colors">
            Demo Login
          </button>
        </div>
      </div>
    </div>
  );
}
