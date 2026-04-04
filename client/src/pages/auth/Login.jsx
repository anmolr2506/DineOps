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
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
                {/* Left Panel */}
                <div className="md:w-1/2 bg-[#EAE5DF] p-10 flex flex-col justify-between relative overflow-hidden">
                    {/* Subtle Background Graphic */}
                    <div className="absolute -bottom-20 -right-20 opacity-20 transform scale-150 pointer-events-none">
                        <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80" alt="Wine Glass" className="mix-blend-multiply rounded-full blur-sm grayscale object-cover w-96 h-96" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl sm:text-5xl font-serif text-gray-900 leading-tight mb-2">
                            <span className="font-bold">The DineOps</span> <br />
                            <span className="italic">Intelligence POS</span> <br />
                            <span className="italic">Solution</span>
                        </h2>
                        <p className="mt-6 text-gray-700 text-lg sm:text-xl max-w-sm">
                            Manage tables, orders, kitchen and billing in one place
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4 mt-12">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#D3E9FA] flex items-center justify-center text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </div>
                            <span className="text-sm font-medium text-gray-800">Precision Table Mapping</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#EADDCD] flex items-center justify-center text-yellow-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <span className="text-sm font-medium text-gray-800">Real-time Revenue Analytics</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-10 sm:p-14 flex flex-col">
                    <div className="flex gap-8 border-b border-gray-200 mb-8 pb-3 text-sm font-semibold tracking-wider">
                        <span className="text-gray-900 border-b-2 border-gray-900 pb-3 -mb-[14px]">SIGN IN</span>
                        <Link to="/signup" className="text-gray-400 hover:text-gray-700 pb-3 -mb-[14px]">CREATE ACCOUNT</Link>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 flex-grow">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 tracking-wider">EMAIL ADDRESS</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="concierge@aetherluxe.com"
                                className="w-full bg-[#FCFBFA] border border-gray-200 px-4 py-3 rounded text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 tracking-wider">PASSWORD</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#FCFBFA] border border-gray-200 px-4 py-3 rounded text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center text-sm text-gray-600">
                                <input type="checkbox" className="mr-2 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                Remember Me
                            </label>
                            <Link to="/forgot-password" className="text-xs font-bold text-[#56A8D6] hover:text-blue-700 tracking-wider">
                                FORGOT PASSWORD?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-[#2B79A3] to-[#80C2ED] text-white font-bold tracking-widest py-4 rounded shadow-md hover:shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
                        >
                            {isLoading ? "SIGNING IN..." : "SIGN IN"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-400 tracking-widest mb-4">OPERATIONAL ACCESS</p>
                        <div className="bg-[#FFEBE9] text-[#A63A3A] p-4 rounded-md flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
                            <p className="text-xs sm:text-sm text-left">
                                <span className="font-bold">Pro Tip:</span> Use your physical keycard for instant tap-to-login if enabled by your restaurant manager.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Login;
