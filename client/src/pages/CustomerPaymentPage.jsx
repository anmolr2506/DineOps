import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const CustomerPaymentPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const table = searchParams.get('table') || '?';
    const token = searchParams.get('token') || '';
    const customerName = decodeURIComponent(searchParams.get('name') || 'Guest');

    const cart = useMemo(() => {
        try {
            return JSON.parse(decodeURIComponent(searchParams.get('cart') || '[]'));
        } catch {
            return [];
        }
    }, [searchParams]);

    const total = useMemo(() => cart.reduce((s, e) => s + e.price * e.qty, 0), [cart]);
    const [seconds, setSeconds] = useState(60);
    const [expired, setExpired] = useState(false);
    const [paid, setPaid] = useState(false);

    /* Countdown timer — 60 seconds */
    useEffect(() => {
        if (paid) return;
        if (seconds <= 0) {
            setExpired(true);
            return;
        }
        const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [seconds, paid]);

    const upiUrl = `upi://pay?pa=dineops@upi&pn=DineOps&am=${total}&cu=INR&tn=Table${table}_${token}`;

    const handlePaymentDone = useCallback(() => {
        setPaid(true);
        const cartData = encodeURIComponent(JSON.stringify(cart));
        setTimeout(() => {
            navigate(`/customer/tracking?table=${table}&token=${token}&name=${encodeURIComponent(customerName)}&cart=${cartData}`);
        }, 1200);
    }, [cart, navigate, table, token, customerName]);

    const regenerateTimer = useCallback(() => {
        setSeconds(60);
        setExpired(false);
    }, []);

    /* Timer progress */
    const progress = seconds / 60;
    const circumference = 2 * Math.PI * 48;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white" style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* Header */}
            <header className="border-b border-[#222] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a14a]">Table {table}</p>
                <h1 className="text-lg font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                    Payment
                </h1>
            </header>

            <main className="flex flex-1 flex-col items-center px-5 py-6">
                {/* Order summary */}
                <div className="w-full rounded-xl border border-[#222] bg-[#141414] p-4">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#888]">Order Summary</h2>
                    {cart.map((item) => (
                        <div key={item.id} className="flex justify-between border-b border-[#1a1a1a] py-2 text-xs last:border-0">
                            <span className="text-[#ccc]">{item.name} × {item.qty}</span>
                            <span className="text-[#c9a14a]">₹{(item.price * item.qty).toFixed(0)}</span>
                        </div>
                    ))}
                    <div className="mt-3 flex justify-between border-t border-[#333] pt-3 text-sm font-bold">
                        <span>Total</span>
                        <span className="text-[#c9a14a]">₹{total.toFixed(0)}</span>
                    </div>
                </div>

                {/* Paid success */}
                {paid ? (
                    <div className="mt-10 flex flex-col items-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-4xl">
                            ✓
                        </div>
                        <p className="mt-4 text-lg font-semibold text-green-400">Payment Successful!</p>
                        <p className="mt-1 text-xs text-[#888]">Redirecting to order tracking...</p>
                    </div>
                ) : (
                    <>
                        {/* Timer ring + QR */}
                        <div className="relative mt-8 flex flex-col items-center">
                            <div className="relative flex h-[130px] w-[130px] items-center justify-center">
                                {/* Background circle */}
                                <svg className="absolute inset-0" width="130" height="130">
                                    <circle cx="65" cy="65" r="48" fill="none" stroke="#222" strokeWidth="4" />
                                    <circle
                                        cx="65" cy="65" r="48" fill="none"
                                        stroke={expired ? '#ef4444' : '#c9a14a'}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        transform="rotate(-90 65 65)"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <span className={`text-2xl font-bold ${expired ? 'text-red-400' : 'text-white'}`}>
                                    {expired ? '0:00' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}
                                </span>
                            </div>
                            <p className="mt-2 text-[10px] text-[#888]">
                                {expired ? 'QR Code expired' : 'Scan to pay via UPI'}
                            </p>
                        </div>

                        {/* UPI QR Code */}
                        <div className="mt-6 rounded-xl bg-white p-4">
                            {expired ? (
                                <div className="flex h-[180px] w-[180px] flex-col items-center justify-center text-center">
                                    <p className="text-sm font-semibold text-red-500">Expired</p>
                                    <button
                                        type="button"
                                        onClick={regenerateTimer}
                                        className="mt-3 rounded-lg bg-[#333] px-4 py-2 text-xs font-semibold text-white"
                                    >
                                        Regenerate
                                    </button>
                                </div>
                            ) : (
                                <QRCodeCanvas
                                    value={upiUrl}
                                    size={180}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="M"
                                />
                            )}
                        </div>

                        <p className="mt-3 text-center text-[10px] text-[#666]">
                            Amount: <span className="font-semibold text-[#c9a14a]">₹{total.toFixed(0)}</span>
                        </p>

                        {/* Payment Done button */}
                        <button
                            type="button"
                            onClick={handlePaymentDone}
                            className="mt-8 w-full rounded-xl bg-gradient-to-r from-[#c9a14a] to-[#e1bf7f] py-4 text-sm font-bold uppercase tracking-widest text-[#1a0e00] transition active:scale-[0.97]"
                        >
                            Payment Done ✓
                        </button>
                    </>
                )}
            </main>
        </div>
    );
};

export default CustomerPaymentPage;
