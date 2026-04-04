import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { getRoleHomeRoute } from '../utils/roleRoutes';

const SessionSelection = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getActiveSessions, joinSession, createSession, stopSession, clearSession, hasSelectedSession } = useSession();
    const isAdmin = user?.role === 'admin';

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joiningSessionId, setJoiningSessionId] = useState(null);
    const [stoppingSessionId, setStoppingSessionId] = useState(null);
    const [newSessionName, setNewSessionName] = useState('');
    const [creatingSession, setCreatingSession] = useState(false);

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
        if (hasSelectedSession && user?.role && !isAdmin) {
            navigate(getRoleHomeRoute(user.role), { replace: true });
            return;
        }

        loadSessions();
    }, [getActiveSessions, hasSelectedSession, isAdmin, navigate, user?.role]);

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

    return (
        <div className="min-h-screen bg-linear-to-br from-[#06121f] via-[#0e1f33] to-[#16253a] px-4 py-10 sm:px-8 text-[#f4ead2]">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 rounded-2xl border border-[#d4b173]/35 bg-[#0a1626]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#d4b173]/80">Shift Gateway</p>
                    <h1 className="mt-2 text-3xl font-semibold">Select an Active Session</h1>
                    <p className="mt-3 max-w-2xl text-sm text-[#f4ead2]/75">
                        Choose your restaurant shift before using POS features. This keeps orders and live activity isolated per session.
                    </p>
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
                                    <span className="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200">
                                        {session.status}
                                    </span>
                                </div>

                                <p className="text-sm text-[#f4ead2]/75">
                                    Started: {new Date(session.start_time).toLocaleString()}
                                </p>

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
            </div>
        </div>
    );
};

export default SessionSelection;
