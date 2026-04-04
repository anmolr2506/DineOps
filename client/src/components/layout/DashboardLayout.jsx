import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const { clearSession } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    clearSession();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Inventory', path: '/inventory', icon: '📦' },
    { name: 'Transactions', path: '/transactions', icon: '💳' },
    { name: 'Sommelier AI', path: '/sommelier', icon: '✨' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0E0E11] text-gray-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] h-full flex flex-col bg-[#141418] border-r border-white/5 py-6 shrink-0 relative">
        <div className="px-8 pb-10">
          <h1 className="text-3xl font-serif italic text-[#dcb973]">DineOps</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`
              }
            >
              <span className="text-lg opacity-80">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Profile / Logout */}
        <div className="mt-auto px-6 py-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#202026] flex items-center justify-center border border-white/10 text-white font-bold">
              {user?.username?.charAt(0)?.toUpperCase() || 'J'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.username || 'James Miller'}</p>
              <p className="text-[10px] text-[#dcb973] uppercase tracking-wider font-semibold">Operational Access</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-400/80 hover:text-red-400 transition-colors"
          >
            <span className="text-lg">⚙️</span>
            Log Out
          </button>
        </div>
        
        {/* Floating Add Button */}
        <button className="absolute bottom-6 -right-6 w-12 h-12 rounded-full bg-[#dcb973] border-4 border-[#0E0E11] flex items-center justify-center text-black text-2xl hover:scale-105 transition-transform shadow-lg shadow-[#dcb973]/20">
          +
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-[80px] shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-[#0E0E11]/80 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold italic text-white flex gap-4 items-center">
             Intelligent POS Solution
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="Search orders..." 
                className="w-64 bg-[#1A1A20] text-sm text-gray-300 rounded-full py-2 pl-9 pr-4 outline-none focus:ring-1 focus:ring-[#dcb973] border border-white/5 transition-all"
              />
            </div>
            <button className="bg-[#dcb973] hover:bg-[#ebd097] text-black text-xs font-bold py-2 px-6 rounded-md tracking-wider transition-colors">
              QUICK SALE
            </button>
          </div>
        </header>

        {/* Dashboard Content Outlet */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
