import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { getRoleHomeRoute } from '../utils/roleRoutes';
import ApprovalPanel from '../components/approval/ApprovalPanel';

const SessionSelection = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        getActiveSessions,
        joinSession,
        createSession,
        stopSession,
        updateSessionPaymentSettings,
        clearSession
    } = useSession();
    const isAdmin = user?.role === 'admin';
    const canViewGlobalDashboard = user?.role === 'admin' || user?.role === 'staff';

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joiningSessionId, setJoiningSessionId] = useState(null);
    const [stoppingSessionId, setStoppingSessionId] = useState(null);
    const [newSessionName, setNewSessionName] = useState('');
    const [creatingSession, setCreatingSession] = useState(false);
    const [settingsSession, setSettingsSession] = useState(null);
    const [settingsForm, setSettingsForm] = useState({
        allow_cash: true,
        allow_digital: true,
        allow_upi: false,
        upi_id: ''
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [approvalPanelOpen, setApprovalPanelOpen] = useState(false);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);

    const loadApprovalRequests = async () => {
        if (!isAdmin) return;
        const [pendingResponse, countResponse] = await Promise.all([
            axios.get('http://localhost:5000/api/users/pending'),
            axios.get('http://localhost:5000/api/users/pending/count')
        ]);
        setPendingUsers(pendingResponse.data.users || []);
        setPendingCount(countResponse.data.pending_count || 0);
    };

    const loadSessions = async () => {
        try {
            setLoading(true);
            setError('');
            const activeSessions = await getActiveSessions();
            setSessions(activeSessions);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load active sessions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Explicitly require a fresh Join action from this screen.
        clearSession();
        loadSessions();
    }, []);

    useEffect(() => {
        if (!isAdmin) return;

        loadApprovalRequests().catch((err) => {
            setError(err.response?.data?.error || 'Failed to load approval requests.');
        });
    }, [isAdmin]);

    const handleJoin = async (sessionId) => {
        try {
            setError('');
            setJoiningSessionId(sessionId);
            await joinSession(sessionId);
            navigate(getRoleHomeRoute(user?.role), { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to join this session.');
        } finally {
            setJoiningSessionId(null);
        }
    };

    const handleOpenFloorPlan = () => {
        setError('');
        navigate('/floor-plan');
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();

        try {
            setCreatingSession(true);
            setError('');
            await createSession(newSessionName.trim());
            setNewSessionName('');
            await loadSessions();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to create session.');
        } finally {
            setCreatingSession(false);
        }
    };

    const handleStopSession = async (sessionId) => {
        try {
            setStoppingSessionId(sessionId);
            setError('');
            await stopSession(sessionId);

            const selectedSessionId = Number(localStorage.getItem('session_id'));
            if (selectedSessionId === sessionId) {
                clearSession();
            }

            await loadSessions();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to stop session.');
        } finally {
            setStoppingSessionId(null);
        }
    };

    const openSettings = (session) => {
        setSettingsSession(session);
        setSettingsForm({
            allow_cash: Boolean(session.allow_cash),
            allow_digital: Boolean(session.allow_digital),
            allow_upi: Boolean(session.allow_upi),
            upi_id: session.upi_id || ''
        });
    };

    const closeSettings = () => {
        setSettingsSession(null);
        setSettingsForm({
            allow_cash: true,
            allow_digital: true,
            allow_upi: false,
            upi_id: ''
        });
    };

    const handleSettingsCheckbox = (event) => {
        const { name, checked } = event.target;
        setSettingsForm((current) => ({
            ...current,
            [name]: checked,
            ...(name === 'allow_upi' && !checked ? { upi_id: '' } : {})
        }));
    };

    const handleSettingsInput = (event) => {
        const { name, value } = event.target;
        setSettingsForm((current) => ({ ...current, [name]: value }));
    };

    const handleSettingsSave = async (event) => {
        event.preventDefault();
        if (!settingsSession?.id) return;

        try {
            setSavingSettings(true);
            setError('');
            await updateSessionPaymentSettings(settingsSession.id, {
                allow_cash: settingsForm.allow_cash,
                allow_digital: settingsForm.allow_digital,
                allow_upi: settingsForm.allow_upi,
                upi_id: settingsForm.upi_id
            });
            await loadSessions();
            closeSettings();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to update session payment settings.');
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#06121f] via-[#0e1f33] to-[#16253a] px-4 py-10 sm:px-8 text-[#f4ead2]">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 rounded-2xl border border-[#d4b173]/35 bg-[#0a1626]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-[#d4b173]/80">Shift Gateway</p>
                            <h1 className="mt-2 text-3xl font-semibold">Select an Active Session</h1>
                            <p className="mt-3 max-w-2xl text-sm text-[#f4ead2]/75">
                                Choose your restaurant shift before using POS features. This keeps orders and live activity isolated per session.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/menu?tab=products')}
                                className="rounded-lg border border-[#d4b173]/45 bg-[#0d1d35] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#f5dfb3] transition hover:bg-[#112443]"
                            >
                                Menu Management
                            </button>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setApprovalPanelOpen(true);
                                        loadApprovalRequests().catch((err) => {
                                            setError(err.response?.data?.error || 'Failed to load approval requests.');
                                        });
                                    }}
                                    className="relative rounded-lg border border-[#d4b173]/45 bg-[#0d1d35] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#f5dfb3] transition hover:bg-[#112443]"
                                >
                                    Approval Requests
                                    {pendingCount > 0 && (
                                        <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#d4b173] px-2 text-xs font-bold text-[#1d1202]">
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleOpenFloorPlan}
                                className="rounded-lg border border-[#d4b173]/45 bg-[#0d1d35] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#f5dfb3] transition hover:bg-[#112443]"
                            >
                                Floor Plan
                            </button>
                            {canViewGlobalDashboard && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="rounded-lg border border-[#d4b173]/45 bg-[#0d1d35] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#f5dfb3] transition hover:bg-[#112443]"
                                >
                                    Global Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <form
                        onSubmit={handleCreateSession}
                        className="mb-6 rounded-2xl border border-[#d4b173]/25 bg-[#0a1626]/70 p-5"
                    >
                        <p className="mb-3 text-sm uppercase tracking-widest text-[#d4b173]/80">Admin Controls</p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="text"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f4ead2] placeholder:text-[#f4ead2]/40 focus:border-[#d4b173]/60 focus:outline-none"
                                placeholder="Session name (optional): Breakfast Shift"
                                maxLength={120}
                            />
                            <button
                                type="submit"
                                disabled={creatingSession}
                                className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#1f1201] disabled:opacity-60"
                            >
                                {creatingSession ? 'Creating...' : 'Create Session'}
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-500/40 bg-red-900/30 px-4 py-3 text-sm text-red-100">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="rounded-2xl border border-[#d4b173]/20 bg-[#0a1626]/70 p-8 text-center text-[#f4ead2]/75">
                        Loading active sessions...
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="rounded-2xl border border-[#d4b173]/20 bg-[#0a1626]/70 p-8 text-center">
                        <p className="text-lg font-medium">No active sessions available</p>
                        <p className="mt-2 text-sm text-[#f4ead2]/70">Ask an admin to open a session and try again.</p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                        {sessions.map((session) => (
                            <article key={session.id} className="rounded-2xl border border-[#d4b173]/30 bg-[#0a1626]/80 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition hover:border-[#e6c48a]/70 hover:-translate-y-0.5">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">{session.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200">
                                            {session.status}
                                        </span>
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => openSettings(session)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-[#d4b173]/35 bg-[#0d1d35] px-3 py-1 text-xs font-semibold text-[#f5dfb3]"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                                                    <path d="M10.8 2h2.4l.5 2.2a8.1 8.1 0 0 1 2 .8l2-1.2 1.7 1.7-1.2 2a8.1 8.1 0 0 1 .8 2l2.2.5v2.4l-2.2.5a8.1 8.1 0 0 1-.8 2l1.2 2-1.7 1.7-2-1.2a8.1 8.1 0 0 1-2 .8l-.5 2.2h-2.4l-.5-2.2a8.1 8.1 0 0 1-2-.8l-2 1.2-1.7-1.7 1.2-2a8.1 8.1 0 0 1-.8-2L2 13.2v-2.4l2.2-.5a8.1 8.1 0 0 1 .8-2l-1.2-2 1.7-1.7 2 1.2a8.1 8.1 0 0 1 2-.8L10.8 2Z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                Settings
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm text-[#f4ead2]/75">
                                    Started: {new Date(session.start_time).toLocaleString()}
                                </p>
                                <p className="mt-2 text-xs text-[#f4ead2]/65">
                                    Payments: {session.allow_cash ? 'Cash' : ''}{session.allow_cash && (session.allow_digital || session.allow_upi) ? ', ' : ''}{session.allow_digital ? 'Digital' : ''}{session.allow_digital && session.allow_upi ? ', ' : ''}{session.allow_upi ? 'UPI' : ''}
                                </p>
                                {session.allow_upi && session.upi_id && (
                                    <p className="mt-1 text-xs text-[#d4b173]/80">UPI ID: {session.upi_id}</p>
                                )}

                                <button
                                    className="mt-6 w-full rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] py-3 text-sm font-semibold uppercase tracking-wide text-[#1f1201] transition hover:opacity-90 disabled:opacity-60"
                                    onClick={() => handleJoin(session.id)}
                                    disabled={joiningSessionId === session.id}
                                >
                                    {joiningSessionId === session.id ? 'Joining...' : 'Join Session'}
                                </button>

                                {isAdmin && (
                                    <button
                                        className="mt-3 w-full rounded-lg border border-red-400/50 bg-red-900/30 py-3 text-sm font-semibold uppercase tracking-wide text-red-100 transition hover:bg-red-900/45 disabled:opacity-60"
                                        onClick={() => handleStopSession(session.id)}
                                        disabled={stoppingSessionId === session.id}
                                    >
                                        {stoppingSessionId === session.id ? 'Stopping...' : 'Stop Session'}
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                )}

                <ApprovalPanel
                    isOpen={approvalPanelOpen}
                    onClose={() => setApprovalPanelOpen(false)}
                    pendingUsers={pendingUsers}
                    onUpdated={loadApprovalRequests}
                />

                {settingsSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                        <form
                            onSubmit={handleSettingsSave}
                            className="w-full max-w-xl rounded-2xl border border-[#d4b173]/35 bg-[#0a1626] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-[#d4b173]/80">Session Settings</p>
                            <h2 className="mt-2 text-2xl font-semibold">{settingsSession.name}</h2>

                            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-semibold text-[#f4ead2]">Allowed Payment Methods</p>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <label className="flex items-center gap-2 text-sm text-[#f4ead2]/85">
                                        <input
                                            type="checkbox"
                                            name="allow_cash"
                                            checked={settingsForm.allow_cash}
                                            onChange={handleSettingsCheckbox}
                                            className="h-4 w-4 rounded border border-white/30"
                                        />
                                        Cash
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-[#f4ead2]/85">
                                        <input
                                            type="checkbox"
                                            name="allow_digital"
                                            checked={settingsForm.allow_digital}
                                            onChange={handleSettingsCheckbox}
                                            className="h-4 w-4 rounded border border-white/30"
                                        />
                                        Digital (Bank, Card)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-[#f4ead2]/85 sm:col-span-2">
                                        <input
                                            type="checkbox"
                                            name="allow_upi"
                                            checked={settingsForm.allow_upi}
                                            onChange={handleSettingsCheckbox}
                                            className="h-4 w-4 rounded border border-white/30"
                                        />
                                        QR Payment (UPI)
                                    </label>
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-sm font-medium text-[#f4ead2]/80">UPI ID</label>
                                    <input
                                        type="text"
                                        name="upi_id"
                                        value={settingsForm.upi_id}
                                        onChange={handleSettingsInput}
                                        disabled={!settingsForm.allow_upi}
                                        placeholder="e.g. 123@okicici"
                                        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f4ead2] placeholder:text-[#f4ead2]/40 focus:border-[#d4b173]/60 focus:outline-none disabled:opacity-50"
                                        maxLength={120}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeSettings}
                                    className="rounded-lg border border-white/20 px-4 py-2 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-4 py-2 text-sm font-semibold text-[#1f1201] disabled:opacity-60"
                                >
                                    {savingSettings ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionSelection;
