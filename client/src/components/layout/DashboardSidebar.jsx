import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuByRole = {
    admin: [
        { label: 'Session Dashboard', to: '/session-dashboard' },
        { label: 'Terminal', to: '/terminal' },
        { label: 'Order History', to: '/order-history' }
    ],
    staff: [
        { label: 'Session Dashboard', to: '/session-dashboard' },
        { label: 'Terminal', to: '/terminal' }
    ],
    kitchen: [
        { label: 'Session Dashboard', to: '/session-dashboard' },
        { label: 'Kitchen', to: '/kitchen' }
    ]
};

const DashboardSidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const role = user?.role || 'staff';
    const menuItems = menuByRole[role] || [];

    return (
        <aside className="relative z-20 w-full border-b border-[#d0aa64]/20 bg-[#081327]/95 p-4 md:h-screen md:w-64 md:border-b-0 md:border-r">
            <div className="mb-6 flex items-center justify-between md:block">
                <div>
                    <h1 className="text-3xl text-[#f8efe0]" style={{ fontFamily: '"Great Vibes", cursive' }}>
                        Dine<span className="text-[#c9a14a]">Ops</span>
                    </h1>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Premium POS</p>
                </div>
            </div>

            <nav className="space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.to}
                        type="button"
                        onClick={() => window.location.assign(item.to)}
                        className={`block w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                            location.pathname === item.to
                                ? 'bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] text-[#1f1506]'
                                : 'text-[#f8efe0]/75 hover:bg-white/5 hover:text-[#f8efe0]'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <button
                type="button"
                onClick={logout}
                className="mt-8 w-full rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-3 text-sm font-semibold text-[#f5dfb3] transition hover:bg-[#112443]"
            >
                Log Out
            </button>
        </aside>
    );
};

export default DashboardSidebar;
