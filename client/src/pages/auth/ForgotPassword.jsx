import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleForgot = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage('');
        try {
            const res = await forgotPassword(email);
            setMessage(res.message || "Reset link sent! Please check your email.");
        } catch (err) {
            setError(err.response?.data?.error || "Error sending reset link.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row bg-[#0A1120] rounded-2xl shadow-[0_0_60px_rgba(255,208,138,0.06)] overflow-hidden min-h-[600px] border border-[#ffd08a]/20">
                {/* Left Panel */}
                <div className="md:w-1/2 bg-[#050B14]/40 p-10 flex flex-col justify-between relative overflow-hidden border-r border-[#ffd08a]/10 hidden md:flex">
                    <div className="absolute -bottom-20 -right-20 opacity-10 transform scale-150 pointer-events-none">
                        <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80" alt="Wine Glass" className="mix-blend-lighten rounded-full blur-md grayscale object-cover w-96 h-96" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl sm:text-5xl text-[#fff7ec] leading-tight mb-2">
                            <span className="font-bold" style={{ fontFamily: '"Great Vibes", cursive' }}>Dine</span>
                            <span className="text-[#ffd08a]" style={{ fontFamily: '"Great Vibes", cursive' }}>Ops</span>
                        </h2>
                        <h3 className="text-xl text-[#f7d9a7]/80 italic font-serif mt-2 mb-6">Intelligence POS Solution</h3>
                        <p className="mt-6 text-[#fff5df]/60 text-base sm:text-lg max-w-sm">
                            Manage tables, orders, kitchen and billing in one centralized cinematic hub.
                        </p>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-10 sm:p-14 flex flex-col relative">
                    <div className="flex gap-8 border-b border-white/10 mb-8 pb-3 text-sm font-semibold tracking-wider">
                        <span className="text-[#fff7ec] border-b-2 border-[#ffd08a] pb-3 -mb-[14px]">RECOVER ACCESS</span>
                        <Link to="/login" className="text-white/30 hover:text-[#ffd08a]/70 transition-colors pb-3 -mb-[14px]">BACK TO LOGIN</Link>
                    </div>

                    <form onSubmit={handleForgot} className="space-y-6 flex-grow flex flex-col justify-center z-10 relative">
                        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}
                        {message && <div className="bg-[#ffd08a]/10 border border-[#ffd08a]/30 text-[#ffd08a] p-3 rounded-md text-sm">{message}</div>}

                        <p className="text-sm text-white/50 pb-4 leading-relaxed">Enter your email address and we'll send you a link to securely reset your password.</p>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#ffd08a]/70 tracking-wider">EMAIL ADDRESS</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="concierge@dineops.com"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#fff7ec] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#ffd08a]/50 transition-all focus:border-[#ffd08a]/50"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !!message}
                            className="w-full mt-4 bg-gradient-to-r from-[#e3b266] to-[#ffd08a] text-black font-extrabold tracking-widest py-4 rounded shadow-[0_4px_14px_rgba(255,208,138,0.2)] hover:shadow-[0_6px_20px_rgba(255,208,138,0.3)] transition-all hover:opacity-90 disabled:opacity-50"
                        >
                            {isLoading ? "SENDING..." : "SEND RESET LINK"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
