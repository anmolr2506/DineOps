import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await login(email, password);
            if (res.role === 'admin') navigate('/admin/dashboard');
            else if (res.role === 'kitchen') navigate('/kitchen/dashboard');
            else navigate('/staff/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || "Login Failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040912] flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row bg-[#0C1730] rounded-2xl shadow-[0_0_60px_rgba(215,178,109,0.08)] overflow-hidden min-h-[600px] border border-[#d7b26d]/25">
                {/* Left Panel */}
                <div className="md:w-1/2 bg-[#040912]/45 p-10 flex flex-col justify-between relative overflow-hidden border-r border-[#d7b26d]/15">
                    {/* Subtle Background Graphic */}
                    <div className="absolute -bottom-20 -right-20 opacity-10 transform scale-150 pointer-events-none">
                        <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80" alt="Wine Glass" className="mix-blend-lighten rounded-full blur-md grayscale object-cover w-96 h-96" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl sm:text-5xl text-[#f8f0e3] leading-tight mb-2">
                            <span className="font-bold" style={{ fontFamily: '"Great Vibes", cursive' }}>Dine</span>
                            <span className="text-[#d7b26d]" style={{ fontFamily: '"Great Vibes", cursive' }}>Ops</span>
                        </h2>
                        <h3 className="text-xl text-[#e8ca95]/80 italic font-serif mt-2 mb-6">Intelligence POS Solution</h3>
                        <p className="mt-6 text-[#ecd9bb]/65 text-base sm:text-lg max-w-sm">
                            Manage tables, orders, kitchen and billing in one centralized cinematic hub.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4 mt-12">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#d7b26d]/10 border border-[#d7b26d]/25 flex items-center justify-center text-[#d7b26d]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </div>
                            <span className="text-sm font-medium text-[#f8f0e3]/80">Precision Table Mapping</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#d7b26d]/10 border border-[#d7b26d]/25 flex items-center justify-center text-[#d7b26d]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <span className="text-sm font-medium text-[#f8f0e3]/80">Real-time Revenue Analytics</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-10 sm:p-14 flex flex-col relative">
                    <div className="flex gap-8 border-b border-white/10 mb-8 pb-3 text-sm font-semibold tracking-wider">
                        <span className="text-[#f8f0e3] border-b-2 border-[#d7b26d] pb-3 -mb-[14px]">SIGN IN</span>
                        <Link to="/signup" className="text-white/30 hover:text-[#d7b26d]/80 transition-colors pb-3 -mb-[14px]">CREATE ACCOUNT</Link>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 flex-grow z-10 relative">
                        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#d7b26d]/80 tracking-wider">EMAIL ADDRESS</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="concierge@dineops.com"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#f8f0e3] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#d7b26d]/50 transition-all focus:border-[#d7b26d]/60"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#d7b26d]/80 tracking-wider">PASSWORD</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#f8f0e3] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#d7b26d]/50 transition-all focus:border-[#d7b26d]/60"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">
                                <input type="checkbox" className="mr-2 w-4 h-4 rounded border-white/20 bg-white/5 text-[#d7b26d] focus:ring-[#d7b26d]/50" />
                                Remember Me
                            </label>
                            <Link to="/forgot-password" className="text-xs font-bold text-[#d7b26d] hover:text-[#e8ca95] tracking-wider transition-colors">
                                FORGOT PASSWORD?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-[#bd8f4a] to-[#d7b26d] text-[#1a1306] font-extrabold tracking-widest py-4 rounded shadow-[0_4px_14px_rgba(215,178,109,0.25)] hover:shadow-[0_6px_20px_rgba(215,178,109,0.35)] transition-all hover:opacity-90 disabled:opacity-50 mt-4"
                        >
                            {isLoading ? "AUTHENTICATING..." : "SIGN IN"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center z-10 relative">
                        <p className="text-xs font-bold text-white/30 tracking-widest mb-4">OPERATIONAL ACCESS</p>
                        <div className="bg-[#d7b26d]/10 border border-[#d7b26d]/25 text-[#d7b26d] p-4 rounded-md flex items-start gap-3 cursor-pointer hover:bg-[#d7b26d]/20 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(215,178,109,0.15)] transition-all duration-300">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
                            <p className="text-xs sm:text-sm text-left">
                                <span className="font-bold">Pro Tip:</span> Use your physical keycard for instant tap-to-login if enabled by your restaurant matrix.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Login;
