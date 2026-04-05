import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    completeCustomerPayment,
    createCustomerOrder,
    fetchCustomerContext
} from '../../services/customerOrdering.service';
import CustomerViewportGuard from '../../components/customer/CustomerViewportGuard';

const STORAGE_CTX = 'dineops_customer_ctx';
const STORAGE_CART = 'dineops_customer_cart';
const STORAGE_ORDER = 'dineops_customer_order';

const CustomerPaymentPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [order, setOrder] = useState(null);
    const [context, setContext] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(60);
    const [confirming, setConfirming] = useState(false);

    const sessionId = Number(searchParams.get('session_id'));
    const tableId = Number(searchParams.get('table_id'));
    const token = searchParams.get('token') || '';

    const queryString = useMemo(() => {
        const params = new URLSearchParams({
            session_id: String(sessionId),
            table_id: String(tableId),
            token: String(token)
        });
        return params.toString();
    }, [sessionId, tableId, token]);

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft((current) => Math.max(0, current - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                setLoading(true);
                setError('');

                const customerCtxRaw = sessionStorage.getItem(STORAGE_CTX);
                const customerCtx = customerCtxRaw ? JSON.parse(customerCtxRaw) : null;
                const cartRaw = sessionStorage.getItem(STORAGE_CART);
                const cart = cartRaw ? JSON.parse(cartRaw) : [];

                if (!customerCtx?.customer_name) {
                    navigate(`/customer?${queryString}`);
                    return;
                }

                if (!Array.isArray(cart) || cart.length === 0) {
                    navigate(`/customer/menu?${queryString}`);
                    return;
                }

                const contextData = await fetchCustomerContext({ sessionId, tableId, token });
                setContext(contextData);

                const savedOrderRaw = sessionStorage.getItem(STORAGE_ORDER);
                const savedOrder = savedOrderRaw ? JSON.parse(savedOrderRaw) : null;
                const isSameContextOrder = Boolean(
                    savedOrder?.id
                    && Number(savedOrder.session_id) === Number(sessionId)
                    && Number(savedOrder.table_id) === Number(tableId)
                );

                if (isSameContextOrder) {
                    setOrder(savedOrder);
                    return;
                }

                // Remove stale cached order from a different table/session context.
                sessionStorage.removeItem(STORAGE_ORDER);

                const createdOrder = await createCustomerOrder({
                    sessionId,
                    tableId,
                    token,
                    customerName: customerCtx.customer_name,
                    items: cart.map((item) => ({
                        product_id: item.product_id,
                        quantity: item.quantity
                    }))
                });

                setOrder(createdOrder);
                sessionStorage.setItem(STORAGE_ORDER, JSON.stringify(createdOrder));
            } catch (requestError) {
                setError(requestError.response?.data?.error || 'Unable to initialize payment.');
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, [navigate, queryString, sessionId, tableId, token]);

    const total = Number(order?.total_amount || 0);

    const confirmPayment = async (mode) => {
        if (!order?.id) return;

        try {
            setConfirming(true);
            setError('');

            await completeCustomerPayment({
                orderId: order.id,
                sessionId,
                tableId,
                token,
                method: 'upi',
                transactionRef: `${mode.toUpperCase()}-${Date.now()}`
            });

            sessionStorage.removeItem(STORAGE_CART);
            sessionStorage.removeItem(STORAGE_ORDER);
            navigate(`/customer/tracking?${queryString}&order_id=${order.id}`);
        } catch (requestError) {
            setError(requestError.response?.data?.error || 'Payment confirmation failed. Please retry.');
        } finally {
            setConfirming(false);
        }
    };

    const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

    return (
        <CustomerViewportGuard>
        <div className="min-h-screen px-4 py-4 text-[#f8efe0]">
            <div className="mx-auto flex w-full max-w-97.5 flex-col gap-4">
                <header className="rounded-[1.6rem] border border-[#C9A14A]/18 bg-[rgba(9,15,28,0.86)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                    <p className="font-body text-[0.68rem] uppercase tracking-[0.32em] text-[#C9A14A]">Payment</p>
                    <h1 className="font-display mt-2 text-[2.1rem] leading-[0.95] font-semibold text-[#f7eed9]">Scan &amp; Pay</h1>
                    <p className="mt-3 text-sm text-[#f8efe0]/75">Table #{tableId}</p>
                </header>

                {loading && <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/75">Preparing your order...</div>}
                {error && <div className="rounded-[1.1rem] border border-red-400/35 bg-red-900/20 p-4 text-sm text-red-100">{error}</div>}

                {!loading && order && (
                    <>
                        <section className="rounded-[1.6rem] border border-white/8 bg-[rgba(9,15,28,0.86)] p-5 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-[#f8efe0]/70">Order #{order.id}</p>
                                <p className="text-sm font-semibold text-[#f2d9a8]">Rs. {total.toFixed(2)}</p>
                            </div>
                            <p className="mt-2 text-[0.68rem] uppercase tracking-[0.28em] text-[#C9A14A]">Timer: {timerLabel}</p>
                            <div className="mt-4 rounded-[1.1rem] border border-[#C9A14A]/18 bg-white/5 p-4 text-center">
                                <p className="font-display text-[1.4rem] leading-none text-[#f7eed9]">UPI Payment</p>
                                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#f8efe0]/65">Manual confirmation</p>
                                <p className="mt-2 text-sm text-[#f8efe0]/75">Complete payment via your UPI app and confirm below.</p>
                            </div>
                        </section>

                        <section className="rounded-[1.6rem] border border-white/8 bg-[rgba(9,15,28,0.86)] p-5 backdrop-blur-sm">
                            <button
                                type="button"
                                disabled={confirming}
                                onClick={() => confirmPayment('upi')}
                                className="w-full rounded-2xl bg-linear-to-r from-[#C9A14A] to-[#d8b15f] px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#1d1204] disabled:opacity-60"
                            >
                                {confirming ? 'Confirming...' : 'I have paid via UPI'}
                            </button>
                            <button
                                type="button"
                                disabled={confirming}
                                onClick={() => confirmPayment('manual')}
                                className="mt-2 w-full rounded-2xl border border-[#C9A14A]/25 bg-[#121f36] px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#f5dfb3] disabled:opacity-60"
                            >
                                Manual Confirm
                            </button>
                            <p className="mt-3 text-center text-[0.68rem] uppercase tracking-[0.2em] text-[#f8efe0]/55">Use manual confirm if needed</p>
                        </section>
                    </>
                )}
            </div>
        </div>
        </CustomerViewportGuard>
    );
};

export default CustomerPaymentPage;
