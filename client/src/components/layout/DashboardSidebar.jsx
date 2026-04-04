import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuByRole = {
    admin: [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Menu', to: '/menu?tab=products' }
    ],
    staff: [
        { label: 'POS', to: '/pos' },
        { label: 'Menu', to: '/menu?tab=products' }
    ],
    kitchen: [
        { label: 'Kitchen', to: '/kitchen' },
        { label: 'Menu', to: '/menu?tab=products' }
    ]
};

const DashboardSidebar = () => {
    const { user, logout } = useAuth();
    const role = user?.role || 'staff';
    const menuItems = menuByRole[role] || [];

    return (
        <aside className="w-full border-b border-[#d0aa64]/20 bg-[#081327]/95 p-4 md:h-screen md:w-64 md:border-b-0 md:border-r">
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
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                                isActive
                                    ? 'bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] text-[#1f1506]'
                                    : 'text-[#f8efe0]/75 hover:bg-white/5 hover:text-[#f8efe0]'
                            }`
                        }
                    >
                        {item.label}
                    </NavLink>
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
