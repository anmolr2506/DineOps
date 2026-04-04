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
            // Wait for 1s on success then redirect to login
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || "Registration Failed");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
                {/* Left Panel */}
                <div className="md:w-1/2 bg-[#EAE5DF] p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex">
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
                        <Link to="/login" className="text-gray-400 hover:text-gray-700 pb-3 -mb-[14px]">SIGN IN</Link>
                        <span className="text-gray-900 border-b-2 border-gray-900 pb-3 -mb-[14px]">CREATE ACCOUNT</span>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4 flex-grow">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 tracking-wider">FULL NAME</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-[#FCFBFA] border border-gray-200 px-4 py-3 rounded text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                                required
                            />
                        </div>

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

                        <div className="flex gap-4">
                            <div className="space-y-1 w-1/2">
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
                            <div className="space-y-1 w-1/2">
                                <label className="text-xs font-bold text-gray-500 tracking-wider">CONFIRM</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#FCFBFA] border border-gray-200 px-4 py-3 rounded text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 tracking-wider">ROLE</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full bg-[#FCFBFA] border border-gray-200 px-4 py-3 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow appearance-none"
                            >
                                <option value="admin">Admin</option>
                                <option value="staff">Staff</option>
                                <option value="kitchen">Kitchen</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 bg-gradient-to-r from-[#2B79A3] to-[#80C2ED] text-white font-bold tracking-widest py-4 rounded shadow-md hover:shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
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
