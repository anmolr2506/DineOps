import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import StatsCard from '../components/dashboard/StatsCard';
import RecentOrders from '../components/dashboard/RecentOrders';
import LiveActivity from '../components/dashboard/LiveActivity';
import SalesChart from '../components/dashboard/SalesChart';

const API_BASE = 'http://localhost:5000/api';

const SessionDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const sessionId = Number(localStorage.getItem('session_id'));
    const hasSession = Number.isInteger(sessionId) && sessionId > 0;

    const [stats, setStats] = useState({});
    const [recentOrders, setRecentOrders] = useState([]);
    const [liveActivity, setLiveActivity] = useState([]);
    const [salesTrend, setSalesTrend] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const socketRef = useRef(null);

    const fetchDashboard = async ({ silent = false } = {}) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            setError('');
            const response = await axios.get(`${API_BASE}/dashboard/session`, {
                params: { session_id: sessionId }
            });

            setStats(response.data.stats || {});
            setRecentOrders(response.data.recentOrders || []);
            setLiveActivity(response.data.liveActivity || []);
            setSalesTrend(response.data.salesTrend || []);
            setLastUpdatedAt(new Date());
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to load session dashboard.');
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (!hasSession) return;
        fetchDashboard();
    }, [sessionId, hasSession]);

    useEffect(() => {
        if (!hasSession) return;

        const socketClient = io('http://localhost:5000', {
            autoConnect: true,
            transports: ['websocket']
        });

        socketRef.current = socketClient;
        socketClient.emit('join_session_room', sessionId);

        const onRealtimeRefresh = () => {
            fetchDashboard({ silent: true });
        };

        const subscribedEvents = [
            'user_joined_session',
            'session_payment_settings_updated',
            'order_created',
            'new_order',
            'order_updated',
            'order_status_updated',
            'payment_recorded',
            'activity_logged',
            'dashboard_refresh'
        ];

        subscribedEvents.forEach((eventName) => {
            socketClient.on(eventName, onRealtimeRefresh);
        });

        const pollInterval = setInterval(() => {
            fetchDashboard({ silent: true });
        }, 15000);

        return () => {
            clearInterval(pollInterval);
            subscribedEvents.forEach((eventName) => {
                socketClient.off(eventName, onRealtimeRefresh);
            });
            socketClient.disconnect();
            socketRef.current = null;
        };
    }, [sessionId, hasSession]);

    const lastUpdatedLabel = useMemo(() => {
        if (!lastUpdatedAt) return 'Live syncing...';
        return `Updated ${lastUpdatedAt.toLocaleTimeString()}`;
    }, [lastUpdatedAt]);

    if (!hasSession) {
        return <Navigate to="/sessions" replace />;
    }

    const hideRevenue = user?.role === 'kitchen';

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
            <DashboardSidebar />
            <main className="relative z-10 flex-1 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Session Dashboard</p>
                            <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Real-time Session Analytics</h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">Session #{sessionId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/75">Live Mode</p>
                            <p className="mt-1 text-sm text-[#f8efe0]/70">{lastUpdatedLabel}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-2 text-sm font-semibold text-[#f5dfb3]"
                        >
                            Back to Global
                        </button>
                    </div>
                </header>

                {error && <div className="rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}
                {loading && <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-[#f8efe0]/70">Loading dashboard...</div>}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                    <StatsCard label="Total Orders" value={stats.total_orders || 0} />
                    <StatsCard label="Pending Approval" value={stats.pending_approval || 0} />
                    <StatsCard label="Paid Orders" value={stats.paid_orders || 0} />
                    {!hideRevenue && <StatsCard label="Revenue" value={`Rs. ${Number(stats.revenue || 0).toFixed(2)}`} accent />}
                    <StatsCard label="Active Tables" value={stats.active_tables || 0} />
                    <StatsCard label="In Kitchen" value={stats.in_kitchen || 0} />
                </section>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <button type="button" onClick={() => navigate('/terminal')} className="rounded-xl border border-[#c9a14a]/30 bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-4 text-sm font-semibold uppercase tracking-wide text-[#1d1204]">New POS Order</button>
                    <button type="button" className="rounded-xl border border-white/15 bg-[#0a1628]/80 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-[#f8efe0]/85">Manage Tables</button>
                    <button type="button" onClick={() => navigate('/generate-qr')} className="rounded-xl border border-white/15 bg-[#0a1628]/80 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-[#f8efe0]/85">Generate QR</button>
                    <button type="button" onClick={() => navigate('/kitchen')} className="rounded-xl border border-white/15 bg-[#0a1628]/80 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-[#f8efe0]/85">View Kitchen</button>
                    <button type="button" className="rounded-xl border border-white/15 bg-[#0a1628]/80 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-[#f8efe0]/85">View Reports</button>
                </section>

                <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                    <RecentOrders orders={recentOrders} />
                    <LiveActivity items={liveActivity} />
                </div>

                <SalesChart points={salesTrend} />
            </div>
            </main>
        </div>
    );
};

export default SessionDashboard;
