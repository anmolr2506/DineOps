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

    // If no token, show error immediately
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded shadow-lg max-w-md w-full text-center">
                    <h2 className="text-red-500 font-bold mb-4">Invalid Link</h2>
                    <p className="mb-6">The password reset link is invalid or missing the token.</p>
                    <Link to="/login" className="text-blue-500 underline">Go straight to login</Link>
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
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-1/2 p-10 sm:p-14 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">Set New Password</h3>

                    <form onSubmit={handleReset} className="space-y-6 flex-grow flex flex-col justify-center">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
                        {message && <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{message}</div>}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 tracking-wider">NEW PASSWORD</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#FCFBFA] border border-gray-200 px-4 py-3 rounded text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 tracking-wider">CONFIRM PASSWORD</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#FCFBFA] border border-gray-200 px-4 py-3 rounded text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !!message}
                            className="w-full mt-4 bg-gradient-to-r from-[#2B79A3] to-[#80C2ED] text-white font-bold tracking-widest py-4 rounded shadow-md hover:shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
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
