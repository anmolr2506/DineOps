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
            <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4">
                <div className="bg-[#0A1120] border border-[#ffd08a]/20 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <h2 className="text-red-400 font-bold mb-4">Invalid Link</h2>
                    <p className="mb-6 text-white/60">The password reset link is invalid or missing the token.</p>
                    <Link to="/login" className="text-[#ffd08a] hover:text-[#fff7ec] transition-colors underline">Go straight to login</Link>
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
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row bg-[#0A1120] rounded-2xl shadow-[0_0_60px_rgba(255,208,138,0.06)] overflow-hidden min-h-[600px] border border-[#ffd08a]/20">
                {/* Left Panel */}
                <div className="md:w-1/2 bg-[#050B14]/40 p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex border-r border-[#ffd08a]/10">
                    <div className="absolute -bottom-20 -right-20 opacity-10 transform scale-150 pointer-events-none">
                        <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80" alt="Wine Glass" className="mix-blend-lighten rounded-full blur-md grayscale object-cover w-96 h-96" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl sm:text-5xl text-[#fff7ec] leading-tight mb-2">
                            <span className="font-bold" style={{ fontFamily: '"Great Vibes", cursive' }}>Dine</span>
                            <span className="text-[#ffd08a]" style={{ fontFamily: '"Great Vibes", cursive' }}>Ops</span>
                        </h2>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-10 sm:p-14 flex flex-col justify-center relative">
                    <h3 className="text-2xl font-bold mb-6 text-[#fff7ec]">Set New Password</h3>

                    <form onSubmit={handleReset} className="space-y-6 flex-grow flex flex-col justify-center z-10 relative">
                        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}
                        {message && <div className="bg-[#ffd08a]/10 border border-[#ffd08a]/30 text-[#ffd08a] p-3 rounded-md text-sm">{message}</div>}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#ffd08a]/70 tracking-wider">NEW PASSWORD</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#fff7ec] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#ffd08a]/50 transition-all focus:border-[#ffd08a]/50"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#ffd08a]/70 tracking-wider">CONFIRM PASSWORD</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#fff7ec] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#ffd08a]/50 transition-all focus:border-[#ffd08a]/50"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !!message}
                            className="w-full mt-4 bg-gradient-to-r from-[#e3b266] to-[#ffd08a] text-black font-extrabold tracking-widest py-4 rounded shadow-[0_4px_14px_rgba(255,208,138,0.2)] hover:shadow-[0_6px_20px_rgba(255,208,138,0.3)] transition-all hover:opacity-90 disabled:opacity-50"
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
