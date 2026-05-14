import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Moon, Map, Pickaxe, Layers, Printer, Wrench, Rocket, Sparkles, LogOut, Filter, Database, LayoutDashboard, Factory, Droplet, Beaker, Satellite } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bases', icon: Map, label: 'Lunar Bases' },
  { to: '/mining', icon: Pickaxe, label: 'Mining Ops' },
  { to: '/resources', icon: Layers, label: 'Resources' },
  { to: '/print_jobs', icon: Printer, label: '3D Print Jobs' },
  { to: '/equipment', icon: Wrench, label: 'Equipment' },
  { to: '/missions', icon: Rocket, label: 'Missions' },
];

const industrialNav = [
  { to: '/orbital-platforms', icon: Factory, label: 'Orbital Platforms' },
  { to: '/isru', icon: Droplet, label: 'ISRU' },
  { to: '/launch-economics', icon: Rocket, label: 'Launch Economics' },
  { to: '/microgravity-products', icon: Beaker, label: 'µg Products' },
  { to: '/servicing', icon: Satellite, label: 'Servicing' },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-800 border-2 border-blue-500 flex items-center justify-center">
              <Moon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">LunarBase</div>
              <div className="text-gray-500 text-xs">Lunar Ops Command</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-800">
            <p className="text-xs text-gray-600 px-3 pb-1 uppercase tracking-wider">Industrial Ops</p>
            {industrialNav.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
          <div className="pt-3 mt-3 border-t border-gray-800">
            <p className="text-xs text-gray-600 px-3 pb-1 uppercase tracking-wider">AI Center</p>
            <NavLink to="/ai"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Sparkles className="w-4 h-4" />
              AI Center
            </NavLink>
          </div>
          <div className="pt-3 mt-3 border-t border-gray-800">
            <p className="text-xs text-gray-600 px-3 pb-1 uppercase tracking-wider">Tools</p>
            <NavLink to="/utilities"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Filter className="w-4 h-4" />
              Utilities
            </NavLink>
            <NavLink to="/sample_data"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Database className="w-4 h-4" />
              Sample Data
            </NavLink>
          </div>
        </nav>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <div className="text-white text-xs font-medium">{user.name || 'Admin'}</div>
              <div className="text-gray-500 text-xs">{user.email}</div>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-950"><Outlet /></main>
    </div>
  );
}
