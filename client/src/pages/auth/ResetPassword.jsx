import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { resetPassword } = useAuth();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!token) {
        return (
            <div className="min-h-screen bg-[#040912] flex items-center justify-center p-4">
                <div className="bg-[#0C1730] border border-[#d7b26d]/25 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <h2 className="text-red-400 font-bold mb-4">Invalid Link</h2>
                    <p className="mb-6 text-white/60">The password reset link is invalid or missing the token.</p>
                    <Link to="/login" className="text-[#d7b26d] hover:text-[#f8f0e3] transition-colors underline">Go straight to login</Link>
                </div>
            </div>
        )
    }

    const handleReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match");
        }

        setIsLoading(true);
        try {
            const res = await resetPassword(token, newPassword);
            setMessage(res.message || "Password successfully reset!");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || "Reset failed. The token may be expired.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040912] flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row bg-[#0C1730] rounded-2xl shadow-[0_0_60px_rgba(215,178,109,0.08)] overflow-hidden min-h-[600px] border border-[#d7b26d]/25">
                {/* Left Panel */}
                <div className="md:w-1/2 bg-[#040912]/45 p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex border-r border-[#d7b26d]/15">
                    <div className="absolute -bottom-20 -right-20 opacity-10 transform scale-150 pointer-events-none">
                        <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80" alt="Wine Glass" className="mix-blend-lighten rounded-full blur-md grayscale object-cover w-96 h-96" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl sm:text-5xl text-[#f8f0e3] leading-tight mb-2">
                            <span className="font-bold" style={{ fontFamily: '"Great Vibes", cursive' }}>Dine</span>
                            <span className="text-[#d7b26d]" style={{ fontFamily: '"Great Vibes", cursive' }}>Ops</span>
                        </h2>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-10 sm:p-14 flex flex-col justify-center relative">
                    <h3 className="text-2xl font-bold mb-6 text-[#f8f0e3]">Set New Password</h3>

                    <form onSubmit={handleReset} className="space-y-6 flex-grow flex flex-col justify-center z-10 relative">
                        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}
                        {message && <div className="bg-[#d7b26d]/10 border border-[#d7b26d]/30 text-[#d7b26d] p-3 rounded-md text-sm">{message}</div>}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#d7b26d]/80 tracking-wider">NEW PASSWORD</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#f8f0e3] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#d7b26d]/50 transition-all focus:border-[#d7b26d]/60"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#d7b26d]/80 tracking-wider">CONFIRM PASSWORD</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#f8f0e3] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#d7b26d]/50 transition-all focus:border-[#d7b26d]/60"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !!message}
                            className="w-full mt-4 bg-gradient-to-r from-[#bd8f4a] to-[#d7b26d] text-[#1a1306] font-extrabold tracking-widest py-4 rounded shadow-[0_4px_14px_rgba(215,178,109,0.25)] hover:shadow-[0_6px_20px_rgba(215,178,109,0.35)] transition-all hover:opacity-90 disabled:opacity-50"
                        >
                            {isLoading ? "SAVING..." : "RESET PASSWORD"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
