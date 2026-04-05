import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { fetchCustomerOrderStatus } from '../../services/customerOrdering.service';
import CustomerViewportGuard from '../../components/customer/CustomerViewportGuard';

const API_SERVER = 'http://localhost:5000';

const OrderTracking = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusData, setStatusData] = useState(null);

    const orderId = Number(searchParams.get('order_id'));
    const sessionId = Number(searchParams.get('session_id'));
    const tableId = Number(searchParams.get('table_id'));
    const token = searchParams.get('token') || '';

    const refreshStatus = async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            setError('');
            const data = await fetchCustomerOrderStatus({ orderId, sessionId, tableId, token });
            setStatusData(data);
        } catch (requestError) {
            setError(requestError.response?.data?.error || 'Unable to load order tracking.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!orderId || !sessionId || !tableId || !token) {
            navigate('/customer', { replace: true });
            return;
        }

        refreshStatus();
    }, [orderId, sessionId, tableId, token]);

    useEffect(() => {
        if (!orderId || !sessionId) return;

        const socket = io(API_SERVER, {
            autoConnect: true,
            transports: ['websocket']
        });

        socket.on('connect', () => {
            socket.emit('join_session_room', sessionId);
        });

        const onRealtime = (payload) => {
            if (Number(payload?.session_id) !== Number(sessionId)) return;
            if (payload?.order_id && Number(payload.order_id) !== Number(orderId)) return;
            refreshStatus({ silent: true });
        };

        socket.on('order_status_updated', onRealtime);
        socket.on('update_item_status', onRealtime);
        socket.on('payment_recorded', onRealtime);

        const poll = setInterval(() => {
            refreshStatus({ silent: true });
        }, 6000);

        return () => {
            clearInterval(poll);
            socket.off('order_status_updated', onRealtime);
            socket.off('update_item_status', onRealtime);
            socket.off('payment_recorded', onRealtime);
            socket.disconnect();
        };
    }, [orderId, sessionId]);

    const progress = useMemo(() => {
        if (!statusData?.tracking) return { received: false, preparing: false, completed: false };
        return statusData.tracking;
    }, [statusData]);

    const statusLabel = String(statusData?.order?.status || '').toUpperCase() || 'PENDING';

    return (
        <CustomerViewportGuard>
        <div className="min-h-screen px-4 py-4 text-[#f8efe0]">
            <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4">
                <header className="rounded-[1.6rem] border border-[#C9A14A]/18 bg-[rgba(9,15,28,0.86)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                    <p className="font-body text-[0.68rem] uppercase tracking-[0.32em] text-[#C9A14A]">Order Tracking</p>
                    <h1 className="font-display mt-2 text-[2.1rem] leading-[0.95] font-semibold text-[#f7eed9]">Order #{orderId}</h1>
                    <p className="mt-3 text-sm text-[#f8efe0]/75">Current Status: {statusLabel}</p>
                </header>

                {loading && <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/75">Loading tracking...</div>}
                {error && <div className="rounded-[1.1rem] border border-red-400/35 bg-red-900/20 p-4 text-sm text-red-100">{error}</div>}

                {!loading && !error && (
                    <>
                        <section className="rounded-[1.6rem] border border-white/8 bg-[rgba(9,15,28,0.86)] p-5 backdrop-blur-sm">
                            <div className="space-y-3">
                                <div className={`rounded-[1rem] border px-3 py-2 text-sm ${progress.received ? 'border-emerald-300/45 bg-emerald-500/12 text-emerald-100' : 'border-white/12 bg-white/5 text-[#f8efe0]/70'}`}>
                                    1. Received
                                </div>
                                <div className={`rounded-[1rem] border px-3 py-2 text-sm ${progress.preparing ? 'border-emerald-300/45 bg-emerald-500/12 text-emerald-100' : 'border-white/12 bg-white/5 text-[#f8efe0]/70'}`}>
                                    2. Preparing
                                </div>
                                <div className={`rounded-[1rem] border px-3 py-2 text-sm ${progress.completed ? 'border-emerald-300/45 bg-emerald-500/12 text-emerald-100' : 'border-white/12 bg-white/5 text-[#f8efe0]/70'}`}>
                                    3. Completed
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[1.6rem] border border-white/8 bg-[rgba(9,15,28,0.86)] p-5 backdrop-blur-sm">
                            <h2 className="text-base font-semibold">Items</h2>
                            <div className="mt-3 space-y-2">
                                {(statusData?.items || []).map((item) => (
                                    <div key={item.id} className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-[#f8efe0]">{item.product_name} x {item.quantity}</p>
                                            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.is_prepared ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'}`}>
                                                {item.is_prepared ? 'Prepared' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
        </CustomerViewportGuard>
    );
};

export default OrderTracking;
