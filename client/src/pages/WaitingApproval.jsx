import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHomeRoute } from '../utils/roleRoutes';

const WaitingApproval = () => {
    const navigate = useNavigate();
    const { user, checkApprovalStatus, logout } = useAuth();
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');

    const statusLabel = useMemo(() => {
        if (user?.approval_status === 'rejected') return 'Rejected';
        if (user?.approval_status === 'approved') return 'Approved';
        return 'Pending Approval';
    }, [user?.approval_status]);

    const refreshStatus = async () => {
        try {
            setChecking(true);
            setError('');
            const current = await checkApprovalStatus();
            if (current.approval_status === 'approved') {
                navigate(getRoleHomeRoute(current.role) || '/sessions', { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to check approval status.');
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        refreshStatus();
    }, []);

    useEffect(() => {
        if (user?.approval_status === 'approved') {
            navigate(getRoleHomeRoute(user.role) || '/sessions', { replace: true });
            return;
        }

        const interval = setInterval(() => {
            refreshStatus();
        }, 7000);

        return () => clearInterval(interval);
    }, [user?.approval_status, user?.role]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#030812] via-[#08162b] to-[#10243d] px-4 py-12 text-[#f8efe0]">
            <div className="pointer-events-none absolute inset-0 opacity-25">
                <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#d4b173]/20 blur-3xl" />
                <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#1f3f63]/40 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-2xl rounded-3xl border border-[#d4b173]/25 bg-white/8 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-12">
                <p className="text-xs uppercase tracking-[0.26em] text-[#d4b173]/80">DineOps Access Control</p>
                <h1 className="mt-3 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                    Your Account Is {statusLabel}
                </h1>
                <p className="mt-4 text-base text-[#f8efe0]/78">
                    Your account is pending admin approval. You will get access as soon as an admin assigns your role.
                </p>

                {user?.approval_status === 'rejected' && (
                    <div className="mt-5 rounded-lg border border-red-400/45 bg-red-900/25 p-4 text-sm text-red-100">
                        Your request was rejected by an admin. Contact your restaurant administrator for reactivation.
                    </div>
                )}

                {error && (
                    <div className="mt-5 rounded-lg border border-red-400/45 bg-red-900/25 p-4 text-sm text-red-100">
                        {error}
                    </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={refreshStatus}
                        disabled={checking}
                        className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#1f1201] disabled:opacity-60"
                    >
                        {checking ? 'Checking...' : 'Refresh Status'}
                    </button>
                    <button
                        type="button"
                        onClick={logout}
                        className="rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#f8efe0]"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WaitingApproval;
