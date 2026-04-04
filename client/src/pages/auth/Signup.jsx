import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('staff');
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
            await register(name, email, password, role);
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.error || "Registration Failed");
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

                    <div className="relative z-10 space-y-4 mt-12">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#ffd08a]/10 border border-[#ffd08a]/20 flex items-center justify-center text-[#ffd08a]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </div>
                            <span className="text-sm font-medium text-[#fff7ec]/80">Precision Table Mapping</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#ffd08a]/10 border border-[#ffd08a]/20 flex items-center justify-center text-[#ffd08a]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <span className="text-sm font-medium text-[#fff7ec]/80">Real-time Revenue Analytics</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-10 sm:p-14 flex flex-col relative">
                    <div className="flex gap-8 border-b border-white/10 mb-8 pb-3 text-sm font-semibold tracking-wider">
                        <Link to="/login" className="text-white/30 hover:text-[#ffd08a]/70 transition-colors pb-3 -mb-[14px]">SIGN IN</Link>
                        <span className="text-[#fff7ec] border-b-2 border-[#ffd08a] pb-3 -mb-[14px]">CREATE ACCOUNT</span>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4 flex-grow z-10 relative">
                        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#ffd08a]/70 tracking-wider">FULL NAME</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#fff7ec] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#ffd08a]/50 transition-all focus:border-[#ffd08a]/50"
                                required
                            />
                        </div>

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

                        <div className="flex gap-4">
                            <div className="space-y-2 w-1/2">
                                <label className="text-xs font-bold text-[#ffd08a]/70 tracking-wider">PASSWORD</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#fff7ec] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#ffd08a]/50 transition-all focus:border-[#ffd08a]/50"
                                    required
                                />
                            </div>
                            <div className="space-y-2 w-1/2">
                                <label className="text-xs font-bold text-[#ffd08a]/70 tracking-wider">CONFIRM</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#fff7ec] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#ffd08a]/50 transition-all focus:border-[#ffd08a]/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#ffd08a]/70 tracking-wider">ROLE</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[#fff7ec] focus:outline-none focus:ring-2 focus:ring-[#ffd08a]/50 transition-all focus:border-[#ffd08a]/50 appearance-none drop-shadow-md"
                            >
                                <option value="admin" className="bg-[#0A1120] text-[#fff7ec]">Admin</option>
                                <option value="staff" className="bg-[#0A1120] text-[#fff7ec]">Staff</option>
                                <option value="kitchen" className="bg-[#0A1120] text-[#fff7ec]">Kitchen</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 bg-gradient-to-r from-[#e3b266] to-[#ffd08a] text-black font-extrabold tracking-widest py-4 rounded shadow-[0_4px_14px_rgba(255,208,138,0.2)] hover:shadow-[0_6px_20px_rgba(255,208,138,0.3)] transition-all hover:opacity-90 disabled:opacity-50"
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
