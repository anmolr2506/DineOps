import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }
        if (password.length < 6) {
            return setError("Password must be at least 6 characters long.");
        }

        setIsLoading(true);
        try {
            await register(name, email, password);
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.error || "Registration Failed");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040912] flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row bg-[#0C1730] rounded-2xl shadow-[0_0_60px_rgba(215,178,109,0.08)] overflow-hidden min-h-[600px] border border-[#d7b26d]/25">
                {/* Left Panel */}
                <div className="md:w-1/2 bg-[#040912]/45 p-10 flex flex-col justify-between relative overflow-hidden border-r border-[#d7b26d]/15 hidden md:flex">
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
                        <Link to="/login" className="text-white/30 hover:text-[#d7b26d]/80 transition-colors pb-3 -mb-[14px]">SIGN IN</Link>
                        <span className="text-[#f8f0e3] border-b-2 border-[#d7b26d] pb-3 -mb-[14px]">CREATE ACCOUNT</span>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4 flex-grow z-10 relative">
                        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#d7b26d]/80 tracking-wider">FULL NAME</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#f8f0e3] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#d7b26d]/50 transition-all focus:border-[#d7b26d]/60"
                                required
                            />
                        </div>

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

                        <div className="flex gap-4">
                            <div className="space-y-2 w-1/2">
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
                            <div className="space-y-2 w-1/2">
                                <label className="text-xs font-bold text-[#d7b26d]/80 tracking-wider">CONFIRM</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#f8f0e3] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#d7b26d]/50 transition-all focus:border-[#d7b26d]/60"
                                    required
                                />
                            </div>
                        </div>

                        <div className="rounded-md border border-[#d7b26d]/30 bg-[#d7b26d]/10 px-4 py-3 text-xs text-[#f8f0e3]/85">
                            Accounts require admin approval before system access. You can sign in after your role is assigned.
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 bg-gradient-to-r from-[#bd8f4a] to-[#d7b26d] text-[#1a1306] font-extrabold tracking-widest py-4 rounded shadow-[0_4px_14px_rgba(215,178,109,0.25)] hover:shadow-[0_6px_20px_rgba(215,178,109,0.35)] transition-all hover:opacity-90 disabled:opacity-50"
                        >
                            {isLoading ? "CREATING..." : "CREATE ACCOUNT"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Signup;
