import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import FilterPanel from '../components/kitchen/FilterPanel';
import TicketCard from '../components/kitchen/TicketCard';
import {
    fetchKitchenOrders,
    setKitchenOrderItemPrepared,
    setKitchenOrderStatus
} from '../services/kitchen.service';

const KitchenPage = () => {
    const { user } = useAuth();
    const { currentSession, getActiveSessions, joinSession } = useSession();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [availableSessions, setAvailableSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [sessionSwitching, setSessionSwitching] = useState(false);

    const socketRef = useRef(null);

    const sessionId = currentSession?.id || Number(localStorage.getItem('session_id')) || null;

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const sessions = await getActiveSessions();
                setAvailableSessions(Array.isArray(sessions) ? sessions : []);
            } catch (_error) {
                setAvailableSessions([]);
            }
        };

        loadSessions();
    }, [getActiveSessions]);

    useEffect(() => {
        if (sessionId) {
            setSelectedSessionId(String(sessionId));
        }
    }, [sessionId]);

    const loadOrders = useCallback(async () => {
        if (!sessionId) return;
        const data = await fetchKitchenOrders(sessionId);
        setOrders(data);
    }, [sessionId]);

    const playNewOrderTone = useCallback(() => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(880, context.currentTime);
            gain.gain.setValueAtTime(0.0001, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.26);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.28);
        } catch (_error) {
            // Ignore audio failures (browser policy/autoplay).
        }
    }, []);

    useEffect(() => {
        const run = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                await loadOrders();
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [sessionId, loadOrders]);

    useEffect(() => {
        if (!sessionId) return;

        const serverOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
        const socket = io(serverOrigin, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_session_room', sessionId);
        });

        socket.on('new_order', async (payload) => {
            if (Number(payload?.session_id) !== Number(sessionId)) return;
            playNewOrderTone();
            await loadOrders();
        });

        socket.on('update_order_status', async () => {
            await loadOrders();
        });

        socket.on('update_item_status', async () => {
            await loadOrders();
        });

        socket.on('order_status_updated', async () => {
            await loadOrders();
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [sessionId, loadOrders, playNewOrderTone]);

    const normalizedOrders = useMemo(
        () =>
            orders.map((order) => ({
                ...order,
                items: Array.isArray(order.items) ? order.items : []
            })),
        [orders]
    );

    const products = useMemo(() => {
        const set = new Set();
        normalizedOrders.forEach((order) => {
            order.items.forEach((item) => {
                if (item.product_name) set.add(item.product_name);
            });
        });
        return [...set].sort((a, b) => a.localeCompare(b));
    }, [normalizedOrders]);

    const categories = useMemo(() => {
        const set = new Set();
        normalizedOrders.forEach((order) => {
            order.items.forEach((item) => {
                if (item.category_name) set.add(item.category_name);
            });
        });
        return [...set].sort((a, b) => a.localeCompare(b));
    }, [normalizedOrders]);

    const filteredOrders = useMemo(() => {
        const term = search.trim().toLowerCase();

        return normalizedOrders.filter((order) => {
            if (status === 'all' && !['received', 'preparing'].includes(order.status)) return false;
            if (status !== 'all' && order.status !== status) return false;

            if (selectedProduct) {
                const hasProduct = order.items.some((item) => item.product_name === selectedProduct);
                if (!hasProduct) return false;
            }

            if (selectedCategory) {
                const hasCategory = order.items.some((item) => item.category_name === selectedCategory);
                if (!hasCategory) return false;
            }

            if (!term) return true;
            const byOrderId = String(order.id).includes(term);
            const byItemName = order.items.some((item) => String(item.product_name || '').toLowerCase().includes(term));
            return byOrderId || byItemName;
        });
    }, [normalizedOrders, status, selectedProduct, selectedCategory, search]);

    const stats = useMemo(() => {
        const today = new Date();
        const isSameDay = (value) => {
            const date = new Date(value);
            return (
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
            );
        };

        const pending = normalizedOrders.filter((order) => ['received', 'preparing'].includes(order.status)).length;
        const completedToday = normalizedOrders.filter((order) => order.status === 'served' && isSameDay(order.created_at)).length;

        return {
            pending,
            completedToday,
            total: normalizedOrders.length
        };
    }, [normalizedOrders]);

    const updateOrderStatusOptimistically = useCallback((orderId, nextStatus) => {
        setOrders((prev) =>
            prev.map((order) =>
                order.id === orderId
                    ? {
                          ...order,
                          status: nextStatus
                      }
                    : order
            )
        );
    }, []);

    const onStartPreparing = useCallback(
        async (orderId) => {
            updateOrderStatusOptimistically(orderId, 'preparing');
            try {
                await setKitchenOrderStatus(orderId, 'preparing');
            } catch (_error) {
                await loadOrders();
            }
        },
        [loadOrders, updateOrderStatusOptimistically]
    );

    const onMarkServed = useCallback(
        async (orderId) => {
            updateOrderStatusOptimistically(orderId, 'served');
            try {
                await setKitchenOrderStatus(orderId, 'served');
            } catch (_error) {
                await loadOrders();
            }
        },
        [loadOrders, updateOrderStatusOptimistically]
    );

    const onTogglePrepared = useCallback(
        async (itemId, isPrepared) => {
            setOrders((prev) =>
                prev.map((order) => ({
                    ...order,
                    items: order.items.map((item) =>
                        item.id === itemId
                            ? {
                                  ...item,
                                  is_prepared: isPrepared
                              }
                            : item
                    )
                }))
            );

            try {
                await setKitchenOrderItemPrepared(itemId, isPrepared);
            } catch (_error) {
                await loadOrders();
            }
        },
        [loadOrders]
    );

    const onSwitchSession = useCallback(async () => {
        const parsedSessionId = Number(selectedSessionId);
        if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) return;
        if (parsedSessionId === Number(sessionId)) return;

        setSessionSwitching(true);
        try {
            await joinSession(parsedSessionId);
        } finally {
            setSessionSwitching(false);
        }
    }, [joinSession, selectedSessionId, sessionId]);

    if (!user) return null;
    if (!['admin', 'kitchen'].includes(user.role)) return <Navigate to="/unauthorized" replace />;

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1b2947_0%,#090f1d_45%,#04070f_100%)] px-4 py-6 pb-28 text-slate-100 md:px-6 lg:px-8">
            <div className="mx-auto max-w-400">
                <header className="mb-6 rounded-2xl border border-[#C9A14A]/30 bg-slate-950/45 p-5 backdrop-blur-md">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#C9A14A]">DineOps</p>
                            <h1 className="text-3xl font-semibold tracking-tight">Kitchen Display</h1>
                            <p className="mt-1 text-sm text-slate-300">
                                Current Session:{' '}
                                <span className="font-semibold text-amber-200">
                                    {currentSession?.name || `#${sessionId || '-'}`}
                                </span>
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 rounded-xl border border-slate-700/70 bg-slate-900/60 p-3">
                            <label className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Switch Session</label>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedSessionId}
                                    onChange={(event) => setSelectedSessionId(event.target.value)}
                                    className="min-w-47.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#C9A14A]"
                                >
                                    {availableSessions.map((session) => (
                                        <option key={session.id} value={session.id}>
                                            {session.name || `Session #${session.id}`}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={onSwitchSession}
                                    disabled={sessionSwitching || !selectedSessionId || Number(selectedSessionId) === Number(sessionId)}
                                    className="rounded-lg border border-[#C9A14A]/70 bg-[#C9A14A]/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100 transition disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {sessionSwitching ? 'Switching...' : 'Switch'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-4 py-3 text-center">
                                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Pending</p>
                                <p className="mt-1 text-2xl font-bold text-amber-200">{stats.pending}</p>
                            </div>
                            <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-4 py-3 text-center">
                                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Completed Today</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-300">{stats.completedToday}</p>
                            </div>
                            <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-4 py-3 text-center">
                                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Total Orders</p>
                                <p className="mt-1 text-2xl font-bold text-cyan-200">{stats.total}</p>
                            </div>
                        </div>

                    </div>
                </header>

                <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
                    <FilterPanel
                        status={status}
                        onStatusChange={setStatus}
                        search={search}
                        onSearchChange={setSearch}
                        selectedProduct={selectedProduct}
                        onProductChange={setSelectedProduct}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        products={products}
                        categories={categories}
                    />

                    <main>
                        {loading ? (
                            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/40 p-10 text-center text-slate-300">
                                Loading kitchen orders...
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/40 p-10 text-center text-slate-300">
                                No tickets match the current filters.
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredOrders.map((order) => (
                                    <TicketCard
                                        key={order.id}
                                        order={order}
                                        onStartPreparing={onStartPreparing}
                                        onTogglePrepared={onTogglePrepared}
                                        onMarkServed={onMarkServed}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </section>
            </div>

        </div>
    );
};

export default KitchenPage;
