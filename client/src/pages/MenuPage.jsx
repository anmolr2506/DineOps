import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CategoriesTab from '../components/menu/CategoriesTab';
import ProductsTab from '../components/menu/ProductsTab';
import VariantsTab from '../components/menu/VariantsTab';

const API_BASE = 'http://localhost:5000/api';

const tabs = [
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
    { id: 'variants', label: 'Variants' }
];

const MenuPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'products';
    const canManage = user?.role === 'admin';
    const [loadingContext, setLoadingContext] = useState(true);
    const [contextError, setContextError] = useState('');

    const validTab = useMemo(() => tabs.some((tab) => tab.id === activeTab) ? activeTab : 'products', [activeTab]);

    useEffect(() => {
        const resolveContext = async () => {
            try {
                setLoadingContext(true);
                setContextError('');
                const response = await axios.get(`${API_BASE}/sessions/active`);
                const activeCount = response.data?.sessions?.length || 0;
                if (activeCount === 0) {
                    setContextError('No active session found. Create a session first to manage menu.');
                }
            } catch (err) {
                setContextError(err.response?.data?.error || 'Unable to load menu context.');
            } finally {
                setLoadingContext(false);
            }
        };

        resolveContext();
    }, []);

    const renderTab = () => {
        if (validTab === 'categories') return <CategoriesTab canManage={canManage} />;
        if (validTab === 'variants') return <VariantsTab canManage={canManage} />;
        return <ProductsTab canManage={canManage} />;
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] px-4 py-6 text-[#f8efe0] sm:px-8">
            <main className="mx-auto max-w-7xl">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Menu</p>
                            <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Menu Management</h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">Manage products, categories, and variant groups in one shared place.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/sessions')}
                            className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-2 text-sm font-semibold text-[#f5dfb3] transition hover:bg-[#112443]"
                        >
                            Sessions
                        </button>
                    </div>
                </header>

                {loadingContext && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/75">
                        Loading menu context...
                    </div>
                )}

                {!loadingContext && contextError && (
                    <div className="mt-4 rounded-xl border border-red-400/40 bg-red-900/30 p-4 text-sm text-red-100">
                        {contextError}
                    </div>
                )}

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

                {!loadingContext && !contextError && <div className="mt-5">{renderTab()}</div>}
            </main>
        </div>
    );
};

export default MenuPage;
