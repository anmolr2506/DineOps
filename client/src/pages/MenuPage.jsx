import { useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import SessionBadge from '../components/SessionBadge';
import CategoriesTab from '../components/menu/CategoriesTab';
import ProductsTab from '../components/menu/ProductsTab';
import VariantsTab from '../components/menu/VariantsTab';

const tabs = [
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
    { id: 'variants', label: 'Variants' }
];

const MenuPage = () => {
    const { user } = useAuth();
    const { currentSession } = useSession();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'products';
    const canManage = user?.role === 'admin';
    const sessionId = Number(localStorage.getItem('session_id'));

    const hasSession = Number.isInteger(sessionId) && sessionId > 0;
    const validTab = useMemo(() => tabs.some((tab) => tab.id === activeTab) ? activeTab : 'products', [activeTab]);

    if (!hasSession) {
        return <Navigate to="/sessions/select" replace />;
    }

    const renderTab = () => {
        if (validTab === 'categories') return <CategoriesTab canManage={canManage} sessionId={sessionId} />;
        if (validTab === 'variants') return <VariantsTab canManage={canManage} sessionId={sessionId} />;
        return <ProductsTab canManage={canManage} sessionId={sessionId} />;
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
            <DashboardSidebar />
            <main className="flex-1 p-4 sm:p-8">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Menu</p>
                            <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Menu Management</h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">Manage products, categories, and variant groups for the current session.</p>
                        </div>
                        <div className="text-right text-sm text-[#f8efe0]/70">
                            <p className="uppercase tracking-[0.2em] text-[#c9a14a]/80">Current Session</p>
                            <p className="font-semibold text-[#f8efe0]">{currentSession?.name || `Session #${sessionId}`}</p>
                        </div>
                    </div>
                </header>

                <div className="mt-4">
                    <SessionBadge />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-[#0a1628]/80 p-2 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSearchParams({ tab: tab.id })}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                    validTab === tab.id
                                        ? 'bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] text-[#1d1204]'
                                        : 'text-[#f8efe0]/75 hover:bg-white/5 hover:text-[#f8efe0]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-5">{renderTab()}</div>
            </main>
        </div>
    );
};

export default MenuPage;
