import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import CashPayment from '../components/pos/CashPayment';

const API_BASE = 'http://localhost:5000/api';
const PENDING_PAYMENT_KEY = 'pending_payment_order';

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
        resolve(true);
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [orderContext, setOrderContext] = useState(location.state?.order || null);
    const [hydrated, setHydrated] = useState(Boolean(location.state?.order));
    const [sessionInfo, setSessionInfo] = useState(null);
    const [method, setMethod] = useState('cash');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!orderContext) {
            const cached = sessionStorage.getItem(PENDING_PAYMENT_KEY);
            if (cached) {
                try {
                    setOrderContext(JSON.parse(cached));
                } catch {
                    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
                }
            }
        }
        setHydrated(true);
    }, [orderContext]);

    useEffect(() => {
        const loadOrderPaymentContext = async () => {
            if (!orderContext?.order_id) return;

            try {
                const response = await axios.get(`${API_BASE}/payment/order/${orderContext.order_id}/context`);
                const context = response.data.context;

                setOrderContext((current) => ({
                    ...(current || {}),
                    order_id: Number(context.order_id),
                    session_id: Number(context.session_id),
                    table_id: Number(context.table_id),
                    total_amount: Number(context.total_amount || 0)
                }));

                setSessionInfo({
                    allow_cash: Boolean(context.allow_cash),
                    allow_digital: Boolean(context.allow_digital),
                    allow_upi: Boolean(context.allow_upi),
                    upi_id: context.upi_id || null
                });

                if (String(context.status).toLowerCase() === 'paid') {
                    setError('This order is already paid.');
                }
                if (String(context.status).toLowerCase() === 'cancelled') {
                    setError('This order is cancelled and cannot be paid.');
                }

                if (!context.allow_cash) {
                    if (context.allow_digital) setMethod('card');
                    else if (context.allow_upi) setMethod('upi');
                }
            } catch (err) {
                setSessionInfo({ allow_cash: true, allow_digital: true, allow_upi: true, upi_id: null });
                setError(err.response?.data?.error || 'Failed to load order payment context.');
            }
        };

        loadOrderPaymentContext();
    }, [orderContext?.order_id]);

    const totalAmount = Number(orderContext?.total_amount || 0);

    const allowedMethods = useMemo(() => ({
        cash: Boolean(sessionInfo?.allow_cash),
        card: Boolean(sessionInfo?.allow_digital),
        upi: Boolean(sessionInfo?.allow_upi)
    }), [sessionInfo]);

    const completePayment = async (payload) => {
        if (!orderContext?.order_id) {
            setError('Order context missing. Please retry from terminal.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await axios.post(`${API_BASE}/payments`, {
                order_id: orderContext.order_id,
                method,
                ...payload
            });

            sessionStorage.removeItem(PENDING_PAYMENT_KEY);
            navigate('/terminal', {
                replace: true,
                state: { message: `Payment completed for Order #${orderContext.order_id}. Sent to kitchen.` }
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Payment failed.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const handleRazorpayPayment = async () => {
        if (!orderContext?.order_id) {
            setError('Order context missing. Please retry from terminal.');
            return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
            setError('Unable to load Razorpay checkout. Please use manual confirmation.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const orderResponse = await axios.post(`${API_BASE}/payment/create-order`, {
                amount: totalAmount,
                order_id: orderContext.order_id
            });

            const razorpayOrder = orderResponse.data;

            const options = {
                key: razorpayOrder.key_id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                order_id: razorpayOrder.order_id,
                name: 'DineOps',
                description: 'Order Payment',
                handler: async (response) => {
                    try {
                        await axios.post(`${API_BASE}/payment/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            order_id: orderContext.order_id
                        });

                        sessionStorage.removeItem(PENDING_PAYMENT_KEY);
                        navigate('/terminal', {
                            replace: true,
                            state: { message: `Payment completed for Order #${orderContext.order_id}. Sent to kitchen.` }
                        });
                    } catch (verifyError) {
                        setError(verifyError.response?.data?.error || 'Payment verification failed. You can use manual confirmation.');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setError('Razorpay payment was cancelled. You can use manual confirmation.');
                    }
                },
                theme: {
                    color: '#C9A14A'
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.error || 'Failed to initialize Razorpay payment.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (!hydrated) {
        return (
            <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
                <DashboardSidebar />
                <main className="relative z-10 flex-1 p-4 sm:p-8">
                    <div className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-8 text-center text-[#f8efe0]/75 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                        Loading payment screen...
                    </div>
                </main>
            </div>
        );
    }

    if (!orderContext) {
        return <Navigate to="/terminal" replace />;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
            <DashboardSidebar />
            <main className="relative z-10 flex-1 p-4 sm:p-8">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Step 5: Payment</p>
                    <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Complete Payment</h1>
                    <p className="mt-2 text-sm text-[#f8efe0]/70">Order #{orderContext.order_id} • Total {currency.format(totalAmount)}</p>
                </header>

                {error && (
                    <div className="mt-4 rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">
                        {error}
                    </div>
                )}

                <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr] items-start">
                    <section className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5 lg:sticky lg:top-6">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">Methods</p>
                        <div className="mt-3 space-y-2">
                            <button
                                type="button"
                                disabled={!allowedMethods.cash}
                                onClick={() => setMethod('cash')}
                                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold ${method === 'cash' ? 'bg-[#c9a14a]/20 border border-[#c9a14a]/70 text-[#f5dfb3]' : 'border border-white/15 text-[#f8efe0]/75'} disabled:opacity-40`}
                            >
                                Cash
                            </button>
                            <button
                                type="button"
                                disabled={!allowedMethods.card}
                                onClick={() => setMethod('card')}
                                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold ${method === 'card' ? 'bg-[#c9a14a]/20 border border-[#c9a14a]/70 text-[#f5dfb3]' : 'border border-white/15 text-[#f8efe0]/75'} disabled:opacity-40`}
                            >
                                Card
                            </button>
                            <button
                                type="button"
                                disabled={!allowedMethods.upi}
                                onClick={() => setMethod('upi')}
                                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold ${method === 'upi' ? 'bg-[#c9a14a]/20 border border-[#c9a14a]/70 text-[#f5dfb3]' : 'border border-white/15 text-[#f8efe0]/75'} disabled:opacity-40`}
                            >
                                UPI QR
                            </button>
                        </div>
                    </section>

                    <section className="space-y-4 max-w-4xl">
                        {method === 'cash' && (
                            <CashPayment
                                total={totalAmount}
                                loading={loading}
                                onApprove={(cashReceived) => completePayment({ cash_received: cashReceived })}
                                onInvalidAmount={(message) => setError(message)}
                            />
                        )}

                        {method === 'card' && (
                            <div className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5">
                                <h2 className="text-xl font-semibold">Card Payment</h2>
                                <p className="mt-2 text-sm text-[#f8efe0]/75">Collect {currency.format(totalAmount)} on card machine and confirm below.</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleRazorpayPayment}
                                        disabled={loading}
                                        className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-3 text-sm font-semibold text-[#1d1204] disabled:opacity-60"
                                    >
                                        {loading ? 'Opening Razorpay...' : 'Pay with Razorpay'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => completePayment({ transaction_ref: `CARD-${Date.now()}` })}
                                        disabled={loading}
                                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-[#f8efe0] disabled:opacity-60"
                                    >
                                        Manual Confirm (Fallback)
                                    </button>
                                </div>
                            </div>
                        )}

                        {method === 'upi' && (
                            <div className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5">
                                <h2 className="text-xl font-semibold">UPI QR Payment</h2>
                                <div className="mt-3 rounded-xl border border-dashed border-[#c9a14a]/45 bg-[#07111f] p-6 text-center">
                                    <p className="text-sm text-[#f8efe0]/80">Use Razorpay checkout for online UPI payment.</p>
                                    <div className="mx-auto mt-3 h-40 w-40 overflow-hidden rounded-lg bg-white p-2">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${sessionInfo?.upi_id || 'demo@upi'}&pn=DineOps&am=${totalAmount}&cu=INR`)}`} 
                                            alt="UPI QR Code" 
                                            className="h-full w-full object-contain mix-blend-multiply"
                                        />
                                    </div>
                                    <p className="mt-3 text-xs text-[#c9a14a]/85">UPI ID: {sessionInfo?.upi_id || 'demo@upi'}</p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleRazorpayPayment}
                                        disabled={loading}
                                        className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-3 text-sm font-semibold text-[#1d1204] disabled:opacity-60"
                                    >
                                        {loading ? 'Opening Razorpay...' : 'Pay with Razorpay'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => completePayment({ transaction_ref: `UPI-MANUAL-${Date.now()}` })}
                                        disabled={loading}
                                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-[#f8efe0] disabled:opacity-60"
                                    >
                                        Manual Confirm (Fallback)
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default PaymentPage;
