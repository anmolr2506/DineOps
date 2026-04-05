import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CustomerScanPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const table = searchParams.get('table') || '?';
    const token = searchParams.get('token') || '';
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleContinue = () => {
        if (!name.trim()) {
            setError('Please enter your name to continue.');
            return;
        }
        navigate(`/customer/menu?table=${table}&token=${token}&name=${encodeURIComponent(name.trim())}`);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0d0d0d] px-5 text-white"
            style={{ maxWidth: 480, margin: '0 auto' }}
        >
            {/* Animated glow ring */}
            <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#c9a14a]" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#c9a14a]/20 to-transparent" />
                <span className="text-5xl">🍽️</span>
            </div>

            {/* Brand */}
            <h1
                className="text-4xl font-semibold text-[#f2d9a8]"
                style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
                DineOps
            </h1>
            <p className="mt-1 text-sm text-[#aaa]">Welcome — your table is ready</p>

            {/* Table badge */}
            <div className="mt-8 rounded-2xl border border-[#c9a14a]/30 bg-[#1a1a1a] px-8 py-5 text-center shadow-[0_0_40px_rgba(201,161,74,0.08)]">
                <p className="text-xs uppercase tracking-[0.25em] text-[#c9a14a]/80">Assigned Table</p>
                <p
                    className="mt-2 text-6xl font-bold text-white"
                    style={{ fontFamily: '"Cormorant Garamond", serif' }}
                >
                    {table}
                </p>
            </div>

            {/* Name input */}
            <div className="mt-8 w-full max-w-xs">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#888]">
                    Your Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-[#333] bg-[#1a1a1a] px-4 py-3.5 text-sm text-white placeholder-[#555] outline-none transition focus:border-[#c9a14a]/50 focus:ring-1 focus:ring-[#c9a14a]/30"
                />
                {error && (
                    <p className="mt-2 text-xs text-red-400">{error}</p>
                )}
            </div>

            {/* Continue button */}
            <button
                type="button"
                onClick={handleContinue}
                className="mt-6 w-full max-w-xs rounded-xl bg-gradient-to-r from-[#c9a14a] to-[#e1bf7f] py-4 text-sm font-bold uppercase tracking-widest text-[#1a0e00] shadow-lg shadow-[#c9a14a]/20 transition active:scale-[0.97]"
            >
                Continue to Menu →
            </button>

            <p className="mt-6 text-center text-[10px] text-[#555]">
                Powered by DineOps • Self-Order System
            </p>
        </div>
    );
};

export default CustomerScanPage;
