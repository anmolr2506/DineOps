import { useState } from 'react';
import axios from 'axios';
import PendingUserCard from './PendingUserCard';

const API_BASE = 'http://localhost:5000/api/users';

const ApprovalPanel = ({ isOpen, onClose, pendingUsers, onUpdated }) => {
    const [processingUserId, setProcessingUserId] = useState(null);
    const [error, setError] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleApprove = async (userId, role) => {
        try {
            setError('');
            setProcessingUserId(userId);
            await axios.post(`${API_BASE}/approve`, { user_id: userId, role });
            await onUpdated();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to approve user.');
        } finally {
            setProcessingUserId(null);
        }
    };

    const handleReject = async (userId) => {
        try {
            setError('');
            setProcessingUserId(userId);
            await axios.post(`${API_BASE}/reject`, { user_id: userId });
            await onUpdated();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject user.');
        } finally {
            setProcessingUserId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
            <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-[#d4b173]/30 bg-linear-to-b from-[#071021]/95 to-[#0f2036]/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-[#d4b173]/75">Admin Queue</p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#f8efe0]">Approval Requests</h2>
                        <p className="mt-1 text-sm text-[#f8efe0]/70">Review and assign role access for new users.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-white/20 px-4 py-2 text-sm text-[#f8efe0] hover:bg-white/10"
                    >
                        Close
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">
                        {error}
                    </div>
                )}

                {pendingUsers.length === 0 ? (
                    <div className="rounded-xl border border-[#d4b173]/20 bg-white/5 p-8 text-center text-[#f8efe0]/75">
                        No pending users right now.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingUsers.map((user) => (
                            <PendingUserCard
                                key={user.id}
                                user={user}
                                processing={processingUserId === user.id}
                                onApprove={handleApprove}
                                onReject={handleReject}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApprovalPanel;
