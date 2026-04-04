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
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 sm:p-8 font-sans">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
                {/* Left Panel */}
                <div className="md:w-1/2 bg-[#EAE5DF] p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex">
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
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-10 sm:p-14 flex flex-col">
                    <div className="flex gap-8 border-b border-gray-200 mb-8 pb-3 text-sm font-semibold tracking-wider">
                        <span className="text-gray-900 border-b-2 border-gray-900 pb-3 -mb-[14px]">RECOVER ACCESS</span>
                        <Link to="/login" className="text-gray-400 hover:text-gray-700 pb-3 -mb-[14px]">BACK TO LOGIN</Link>
                    </div>

                    <form onSubmit={handleForgot} className="space-y-6 flex-grow flex flex-col justify-center">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
                        {message && <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{message}</div>}

                        <p className="text-sm text-gray-500 pb-4">Enter your email address and we'll send you a link to securely reset your password.</p>

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

                        <button
                            type="submit"
                            disabled={isLoading || !!message}
                            className="w-full mt-4 bg-gradient-to-r from-[#2B79A3] to-[#80C2ED] text-white font-bold tracking-widest py-4 rounded shadow-md hover:shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
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
