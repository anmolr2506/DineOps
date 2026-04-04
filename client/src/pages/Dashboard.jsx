import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/dashboardApi';
import KPISection from '../components/dashboard/KPISection';
import RevenueChart from '../components/dashboard/RevenueChart';
import OrdersTable from '../components/dashboard/OrdersTable';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import TopProducts from '../components/dashboard/TopProducts';
import CategoryPerformance from '../components/dashboard/CategoryPerformance';
import KitchenPanel from '../components/dashboard/KitchenPanel';

const sidebarItems = {
    admin: [
        { id: 'kpis', label: 'Dashboard' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'orders', label: 'Orders' },
        { id: 'activity', label: 'Live Activity' },
        { id: 'products', label: 'Top Products' },
        { id: 'categories', label: 'Categories' },
    ],
    staff: [
        { id: 'kpis', label: 'Dashboard' },
        { id: 'orders', label: 'Orders' },
        { id: 'activity', label: 'Live Activity' },
    ],
    kitchen: [
        { id: 'kpis', label: 'Dashboard' },
        { id: 'kitchen', label: 'Preparation' },
        { id: 'activity', label: 'Status Updates' },
    ],
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

const Dashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const socketRef = useRef(null);

    const sessionParam = searchParams.get('session_id');
    const [sessionId, setSessionId] = useState(() => sessionParam || localStorage.getItem('session_id') || '');
    const [kpis, setKpis] = useState(null);
    const [revenueTrend, setRevenueTrend] = useState([]);
    const [dailySales, setDailySales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [categoryPerformance, setCategoryPerformance] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [liveActivity, setLiveActivity] = useState([]);
    const [preparation, setPreparation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [busyOrderId, setBusyOrderId] = useState(null);

    useEffect(() => {
        if (sessionParam && sessionParam !== sessionId) {
            setSessionId(sessionParam);
        }
    }, [sessionParam, sessionId]);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem('session_id', String(sessionId));
            if (sessionParam !== String(sessionId)) {
                setSearchParams({ session_id: String(sessionId) }, { replace: true });
            }
        }
    }, [sessionId, sessionParam, setSearchParams]);

    useEffect(() => {
        if (!sessionId) {
            return undefined;
        }

        const socket = io('http://localhost:5000', {
            transports: ['websocket'],
            auth: {
                token,
                sessionId: String(sessionId),
            },
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('dashboard:join', { sessionId: String(sessionId) });
        });

        socket.on('dashboard:update', () => {
            loadDashboard({ silent: true });
        });

        socket.on('disconnect', () => {
            socket.emit('dashboard:leave', { sessionId: String(sessionId) });
        });

        return () => {
            socket.emit('dashboard:leave', { sessionId: String(sessionId) });
            socket.disconnect();
            socketRef.current = null;
        };
    }, [loadDashboard, sessionId, token]);

    const role = user?.role || 'staff';
    const menuItems = sidebarItems[role] || sidebarItems.staff;
    const isAdmin = role === 'admin';
    const isKitchen = role === 'kitchen';

    const scrollToSection = (id) => {
        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const loadDashboard = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        setError(null);

        try {
            const sessionArg = sessionId || undefined;
            const requests = [
                dashboardApi.getKpis(sessionArg),
                dashboardApi.getRecentOrders(sessionArg),
                dashboardApi.getLiveActivity(sessionArg),
            ];

            if (isKitchen) {
                requests.push(dashboardApi.getOngoingPreparation(sessionArg));
            }

            if (isAdmin) {
                requests.push(
                    dashboardApi.getRevenueTrend(sessionArg),
                    dashboardApi.getDailySales(sessionArg),
                    dashboardApi.getTopProducts(sessionArg),
                    dashboardApi.getCategoryPerformance(sessionArg),
                );
            }

            const results = await Promise.allSettled(requests);
            let offset = 0;

            const kpisResult = results[offset++];
            if (kpisResult.status === 'fulfilled') {
                const data = kpisResult.value.data || {};
                setKpis(data);
                if (!sessionId && data.session_id) {
                    setSessionId(String(data.session_id));
                }
            } else {
                throw kpisResult.reason;
            }

            const recentOrdersResult = results[offset++];
            if (recentOrdersResult.status === 'fulfilled') {
                setRecentOrders(recentOrdersResult.value.data || []);
            }

            const activityResult = results[offset++];
            if (activityResult.status === 'fulfilled') {
                setLiveActivity(activityResult.value.data || []);
            }

            if (isKitchen) {
                const prepResult = results[offset++];
                if (prepResult.status === 'fulfilled') {
                    setPreparation(prepResult.value.data || []);
                }
            }

            if (isAdmin) {
                const revenueResult = results[offset++];
                const salesResult = results[offset++];
                const productsResult = results[offset++];
                const categoriesResult = results[offset++];

                if (revenueResult.status === 'fulfilled') {
                    setRevenueTrend(revenueResult.value.data || []);
                }
                if (salesResult.status === 'fulfilled') {
                    setDailySales(salesResult.value.data || []);
                }
                if (productsResult.status === 'fulfilled') {
                    setTopProducts(productsResult.value.data || []);
                }
                if (categoriesResult.status === 'fulfilled') {
                    setCategoryPerformance(categoriesResult.value.data || []);
                }
            }

            setLastUpdated(new Date());
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to load dashboard data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAdmin, isKitchen, sessionId]);

    useEffect(() => {
        loadDashboard();
        const intervalId = window.setInterval(() => {
            loadDashboard({ silent: true });
        }, 30000);

        return () => window.clearInterval(intervalId);
    }, [loadDashboard]);

    const handleStatusUpdate = async (orderId) => {
        setBusyOrderId(orderId);
        try {
            await dashboardApi.updatePreparationStatus(orderId, 'completed');
            await loadDashboard({ silent: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to update order status.');
        } finally {
            setBusyOrderId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const pageTitle = isKitchen ? 'Kitchen Dashboard' : isAdmin ? 'Admin Dashboard' : 'Staff Dashboard';
    const pageSubtitle = isKitchen
        ? 'Preparation queue, incoming orders, and status updates'
        : isAdmin
            ? 'Monitor orders, payments, kitchen, and performance'
            : 'Monitor orders, payments, tables, and approvals';

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,168,106,0.10),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(32,47,83,0.55),transparent_30%),linear-gradient(180deg,#040404_0%,#05060a_100%)] text-[#f4ead8]">
            <div className="flex min-h-screen">
                <aside className="hidden w-72 shrink-0 flex-col border-r border-white/8 bg-[#070b14]/90 px-5 py-6 lg:flex">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
                        <div className="text-sm uppercase tracking-[0.4em] text-[#c9a86a]">DineOps</div>
                        <div className="mt-2 text-2xl font-semibold text-[#f5ecdc]">The Cellar</div>
                        <p className="mt-2 text-sm leading-6 text-white/45">Premium POS intelligence for restaurant operations.</p>
                    </div>

                    <nav className="mt-8 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => scrollToSection(item.id)}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.05] hover:text-[#f7edd7]"
                            >
                                <span className="h-2 w-2 rounded-full bg-[#c9a86a]" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto space-y-4">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                            <div className="text-xs uppercase tracking-[0.28em] text-white/35">Signed in</div>
                            <div className="mt-2 text-sm font-medium text-[#f5ecdc]">{user?.name || 'Operational User'}</div>
                            <div className="mt-1 text-xs text-white/45">{role}</div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center rounded-xl border border-[#c9a86a]/25 bg-[#c9a86a]/10 px-4 py-3 text-sm font-semibold text-[#f7edd7] transition-colors hover:bg-[#c9a86a]/15"
                        >
                            Log Out
                        </button>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto">
                    <header className="sticky top-0 z-20 border-b border-white/8 bg-[#05070d]/85 backdrop-blur-xl">
                        <div className="px-5 py-4 lg:px-8">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5ecdc]">{pageTitle}</h1>
                                        <span className="rounded-full border border-[#c9a86a]/30 bg-[#c9a86a]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#f7edd7]">
                                            Session {sessionId ? `#${sessionId}` : 'Auto'}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-white/45">{pageSubtitle}</p>
                                </div>

                                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                    <div className="flex h-11 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-4 text-sm text-white/45">
                                        <svg className="h-4 w-4 text-[#c9a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                        </svg>
                                        <span>Search orders...</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => loadDashboard({ silent: true })}
                                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06]"
                                        >
                                            {refreshing ? 'Refreshing...' : 'Refresh'}
                                        </button>
                                        {role !== 'kitchen' ? (
                                            <button
                                                type="button"
                                                className="rounded-xl bg-gradient-to-r from-[#9f7736] to-[#c9a86a] px-5 py-2.5 text-sm font-semibold text-[#120d05] shadow-[0_12px_28px_rgba(201,168,106,0.18)] transition-opacity hover:opacity-95"
                                            >
                                                Quick Sale
                                            </button>
                                        ) : null}
                                        {isAdmin ? (
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('categories')}
                                                className="rounded-xl border border-[#c9a86a]/25 bg-[#c9a86a]/10 px-5 py-2.5 text-sm font-semibold text-[#f7edd7] transition-colors hover:bg-[#c9a86a]/15"
                                            >
                                                Reports
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/40">
                                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : 'Loading live data...'}</span>
                                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{user?.email}</span>
                                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{currencyFormatter.format(Number(kpis?.today_revenue || 0))} today</span>
                            </div>
                        </div>
                    </header>

                    <div className="px-5 py-6 lg:px-8 lg:py-8">
                        {error ? (
                            <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                {error}
                            </div>
                        ) : null}

                        <div className="space-y-6">
                            <KPISection kpis={kpis} role={role} loading={loading} />

                            {isAdmin ? (
                                <>
                                    <RevenueChart revenueTrend={revenueTrend} dailySales={dailySales} />

                                    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
                                        <OrdersTable orders={recentOrders} loading={loading} />
                                        <ActivityFeed activity={liveActivity} loading={loading} />
                                    </div>

                                    <div id="products" className="grid gap-6 xl:grid-cols-2">
                                        <TopProducts products={topProducts} loading={loading} />
                                        <CategoryPerformance categories={categoryPerformance} loading={loading} />
                                    </div>
                                </>
                            ) : null}

                            {role === 'staff' ? (
                                <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
                                    <OrdersTable orders={recentOrders} loading={loading} />
                                    <ActivityFeed activity={liveActivity} loading={loading} />
                                </div>
                            ) : null}

                            {isKitchen ? (
                                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                                    <KitchenPanel
                                        preparation={preparation}
                                        loading={loading}
                                        onMarkCompleted={handleStatusUpdate}
                                        busyOrderId={busyOrderId}
                                    />
                                    <ActivityFeed activity={liveActivity} loading={loading} />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
