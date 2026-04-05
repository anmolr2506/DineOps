import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const STATUSES = ['Confirmed', 'Preparing', 'In Kitchen', 'Ready'];
const STATUS_COLORS = {
    'Confirmed': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    'Preparing': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    'In Kitchen': { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    'Ready': { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
};

const CustomerTrackingPage = () => {
    const [searchParams] = useSearchParams();
    const table = searchParams.get('table') || '?';
    const customerName = decodeURIComponent(searchParams.get('name') || 'Guest');

    const cart = useMemo(() => {
        try {
            return JSON.parse(decodeURIComponent(searchParams.get('cart') || '[]'));
        } catch {
            return [];
        }
    }, [searchParams]);

    /* Track status per item — start all at 'Confirmed' */
    const [itemStatuses, setItemStatuses] = useState(() =>
        cart.map((item) => ({ ...item, status: 'Confirmed', statusIndex: 0 }))
    );
    const [allReady, setAllReady] = useState(false);

    /* Simulate status progression */
    useEffect(() => {
        const interval = setInterval(() => {
            setItemStatuses((prev) => {
                const allDone = prev.every((item) => item.statusIndex >= STATUSES.length - 1);
                if (allDone) {
                    clearInterval(interval);
                    return prev;
                }

                /* Find a random item that isn't done yet and advance it */
                const pendingIndices = prev
                    .map((item, i) => (item.statusIndex < STATUSES.length - 1 ? i : -1))
                    .filter((i) => i !== -1);

                if (pendingIndices.length === 0) return prev;

                const randomIdx = pendingIndices[Math.floor(Math.random() * pendingIndices.length)];

                return prev.map((item, i) => {
                    if (i !== randomIdx) return item;
                    const nextStatusIndex = item.statusIndex + 1;
                    return { ...item, statusIndex: nextStatusIndex, status: STATUSES[nextStatusIndex] };
                });
            });
        }, 6000 + Math.random() * 4000); /* 6-10 seconds */

        return () => clearInterval(interval);
    }, []);

    /* Check if all done */
    useEffect(() => {
        const done = itemStatuses.every((item) => item.status === 'Ready');
        if (done && itemStatuses.length > 0) {
            setTimeout(() => setAllReady(true), 500);
        }
    }, [itemStatuses]);

    const total = useMemo(() => cart.reduce((s, e) => s + e.price * e.qty, 0), [cart]);

    return (
        <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white" style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* Header */}
            <header className="border-b border-[#222] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a14a]">Table {table}</p>
                <h1 className="text-lg font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                    Order Tracking
                </h1>
                <p className="mt-1 text-xs text-[#888]">
                    {customerName} • ₹{total.toFixed(0)}
                </p>
            </header>

            <main className="flex-1 px-4 py-5">
                {/* Success banner */}
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
                    <span className="text-xl">✓</span>
                    <div>
                        <p className="text-sm font-semibold text-green-400">Order Confirmed</p>
                        <p className="text-[10px] text-green-400/70">Payment received • Preparing your order</p>
                    </div>
                </div>

                {/* Progress overview */}
                <div className="mb-5 flex items-center justify-between rounded-xl border border-[#222] bg-[#141414] px-4 py-3">
                    {STATUSES.map((status, idx) => {
                        const completedCount = itemStatuses.filter(
                            (item) => item.statusIndex >= idx
                        ).length;
                        const isActive = completedCount > 0;
                        return (
                            <div key={status} className="flex flex-col items-center">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                        isActive
                                            ? 'bg-[#c9a14a] text-[#1a0e00]'
                                            : 'border border-[#333] text-[#555]'
                                    }`}
                                >
                                    {idx + 1}
                                </div>
                                <p className="mt-1 text-[8px] text-[#888]">{status}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Item list with status */}
                <div className="space-y-3">
                    {itemStatuses.map((item, idx) => {
                        const colors = STATUS_COLORS[item.status];
                        return (
                            <div
                                key={`${item.id}-${idx}`}
                                className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#141414] p-3 transition-all"
                            >
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-12 w-12 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1">
                                    <p className="text-xs font-semibold">{item.name}</p>
                                    <p className="text-[10px] text-[#777]">Qty: {item.qty}</p>
                                </div>
                                <span
                                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${colors.bg} ${colors.text} ${colors.border} ${
                                        item.status === 'Preparing' ? 'animate-pulse' : ''
                                    }`}
                                >
                                    {item.status === 'Ready' ? '✓ ' : ''}{item.status}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* All ready celebration */}
                {allReady && (
                    <div className="mt-8 flex flex-col items-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-4xl animate-bounce">
                            🎉
                        </div>
                        <p className="mt-4 text-lg font-bold text-green-400" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                            All Items Ready!
                        </p>
                        <p className="mt-1 text-xs text-[#888]">Your order is ready to be served. Enjoy your meal!</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-[#222] px-4 py-4 text-center text-[10px] text-[#555]">
                Powered by DineOps • Self-Order System
            </footer>
        </div>
    );
};

export default CustomerTrackingPage;
