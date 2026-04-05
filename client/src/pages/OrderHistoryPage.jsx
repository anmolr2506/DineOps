import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import ReceiptButton from '../components/ReceiptButton';

const API_BASE = 'http://localhost:5000/api';

const OrderHistoryPage = () => {
    const [filters, setFilters] = useState({
        session_id: '',
        table_id: '',
        date: ''
    });
    const [sessions, setSessions] = useState([]);
    const [sessionStatusFilter, setSessionStatusFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingOrderId, setProcessingOrderId] = useState(null);

    const loadSessions = async () => {
        const response = await axios.get(`${API_BASE}/sessions/all`);
        setSessions(response.data.sessions || []);
    };

    const loadOrders = async (nextFilters = filters) => {
        try {
            setLoading(true);
            setError('');
            const params = {};
            if (nextFilters.session_id) params.session_id = Number(nextFilters.session_id);
            if (nextFilters.table_id) params.table_id = Number(nextFilters.table_id);
            if (nextFilters.date) params.date = nextFilters.date;

            const response = await axios.get(`${API_BASE}/orders`, { params });
            setOrders(response.data.orders || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch orders.');
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = useMemo(() => {
        if (sessionStatusFilter === 'all') {
            return sessions;
        }

        return sessions.filter((session) => String(session.status || '').toLowerCase() === sessionStatusFilter);
    }, [sessions, sessionStatusFilter]);

    useEffect(() => {
        Promise.all([loadSessions(), loadOrders()]).catch(() => {});
    }, []);

    const handleDecision = async (orderId, action) => {
        try {
            setProcessingOrderId(orderId);
            setError('');
            await axios.patch(`${API_BASE}/orders/${orderId}/decision`, { action });
            await loadOrders(filters);
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${action} order.`);
        } finally {
            setProcessingOrderId(null);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
            <DashboardSidebar />
            <main className="relative z-10 flex-1 p-4 sm:p-8">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Admin</p>
                    <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Order History</h1>
                    <p className="mt-2 text-sm text-[#f8efe0]/70">Filter by session, date, and table.</p>
                </header>

                <section className="mt-5 rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5">
                    <div className="mb-4 flex flex-wrap gap-2">
                        {["all", "active", "closed"].map((status) => {
                            const isSelected = sessionStatusFilter === status;
                            const label = status === 'all' ? 'All Sessions' : `${status.charAt(0).toUpperCase()}${status.slice(1)} Sessions`;

                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setSessionStatusFilter(status)}
                                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                                        isSelected
                                            ? 'bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] text-[#1d1204]'
                                            : 'border border-[#c9a14a]/35 bg-[#0d1d35] text-[#f5dfb3] hover:border-[#c9a14a]/60'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                        <select
                            value={filters.session_id}
                            onChange={(event) => setFilters((current) => ({ ...current, session_id: event.target.value }))}
                            className="rounded-lg border border-white/15 bg-white px-3 py-2 text-sm text-black"
                        >
                            <option value="">All Sessions</option>
                            {filteredSessions.map((session) => (
                                <option key={session.id} value={session.id}>
                                    {session.name} ({String(session.status || '').toLowerCase() === 'closed' ? 'Closed' : 'Active'})
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            min="1"
                            value={filters.table_id}
                            onChange={(event) => setFilters((current) => ({ ...current, table_id: event.target.value }))}
                            placeholder="Table ID"
                            className="rounded-lg border border-white/15 bg-white px-3 py-2 text-sm text-black"
                        />

                        <input
                            type="date"
                            value={filters.date}
                            onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
                            className="rounded-lg border border-white/15 bg-white px-3 py-2 text-sm text-black"
                        />

                        <button
                            type="button"
                            onClick={() => loadOrders(filters)}
                            className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-2 text-sm font-semibold text-[#1d1204]"
                        >
                            Apply Filters
                        </button>
                    </div>

                    {error && <div className="mt-4 rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}

                    <div className="mt-4 space-y-3">
                        {!loading && orders.length === 0 && (
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/70">No orders found.</div>
                        )}

                        {orders.map((order) => (
                            <article key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-[#f8efe0]">Order #{order.id}</h3>
                                    <span className="rounded-full border border-[#c9a14a]/45 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f5dfb3]">{order.status}</span>
                                </div>
                                <p className="mt-2 text-xs text-[#f8efe0]/70">
                                    Session #{order.session_id} • Table {order.table_number ? `T-${String(order.table_number).padStart(2, '0')}` : order.table_id} • {new Date(order.created_at).toLocaleString()}
                                </p>
                                <p className="mt-2 text-xs font-semibold text-[#f5dfb3]">Total: Rs. {Number(order.total_amount || 0).toFixed(2)}</p>
                                <div className="mt-3 space-y-1 text-xs text-[#f8efe0]/75">
                                    {(order.items || []).map((item, index) => (
                                        <div key={`${order.id}-${index}`}>
                                            <p>{item.product_name || `Product #${item.product_id}`} × {item.quantity} (Rs. {Number(item.subtotal || 0).toFixed(2)})</p>
                                            {Array.isArray(item.variants) && item.variants.length > 0 && (
                                                <p className="text-[11px] text-[#f8efe0]/60">
                                                    {item.variants.map((variant) => `${variant.group_name}: ${variant.value_name}`).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {['pending', 'approved'].includes(String(order.status || '').toLowerCase()) && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDecision(order.id, 'approve')}
                                            disabled={processingOrderId === order.id}
                                            className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#1d1204] disabled:opacity-60"
                                        >
                                            {processingOrderId === order.id ? 'Processing...' : 'Approve (Mark Paid)'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDecision(order.id, 'reject')}
                                            disabled={processingOrderId === order.id}
                                            className="rounded-lg border border-red-400/45 bg-red-900/25 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-100 disabled:opacity-60"
                                        >
                                            {processingOrderId === order.id ? 'Processing...' : 'Reject Order'}
                                        </button>
                                    </div>
                                )}

                                {['paid', 'completed'].includes(String(order.status || '').toLowerCase()) && (
                                    <div className="mt-4">
                                        <ReceiptButton orderId={order.id} />
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default OrderHistoryPage;
