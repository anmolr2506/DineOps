import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import StatsCard from '../components/dashboard/StatsCard';
import SessionCard from '../components/dashboard/SessionCard';
import SalesChart from '../components/dashboard/SalesChart';

const API_BASE = 'http://localhost:5000/api';

const GlobalDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { joinSession, createSession, stopSession, updateSessionPaymentSettings, clearSession } = useSession();
    const isAdmin = user?.role === 'admin';

    const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, active_sessions: 0, orders_in_kitchen: 0 });
    const [trend, setTrend] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newSessionName, setNewSessionName] = useState('');
    const [creatingSession, setCreatingSession] = useState(false);
    const [joiningSessionId, setJoiningSessionId] = useState(null);
    const [stoppingSessionId, setStoppingSessionId] = useState(null);
    const [settingsSession, setSettingsSession] = useState(null);
    const [settingsForm, setSettingsForm] = useState({ allow_cash: true, allow_digital: true, allow_upi: false, upi_id: '' });
    const [savingSettings, setSavingSettings] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((left, right) => {
            if (left.status === right.status) return new Date(right.start_time) - new Date(left.start_time);
            return left.status === 'active' ? -1 : 1;
        });
    }, [sessions]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError('');
            const params = {};
            if (selectedSessionId !== 'all') {
                params.session_id = Number(selectedSessionId);
            }
            if (dateFrom) {
                params.date_from = dateFrom;
            }
            if (dateTo) {
                params.date_to = dateTo;
            }

            const response = await axios.get(`${API_BASE}/dashboard/global`, { params });
            setStats(response.data.stats || {});
            setTrend(response.data.trend || []);
            setSessions(response.data.sessions || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to load global dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        clearSession();
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [selectedSessionId, dateFrom, dateTo]);

    const handleEnterSession = async (sessionId) => {
        try {
            setJoiningSessionId(sessionId);
            setError('');
            await joinSession(sessionId);
            navigate('/session-dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to enter session.');
        } finally {
            setJoiningSessionId(null);
        }
    };

    const handleCreateSession = async (event) => {
        event.preventDefault();

        try {
            setCreatingSession(true);
            setError('');
            await createSession(newSessionName.trim());
            setNewSessionName('');
            await loadDashboard();
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
            await loadDashboard();
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

    const handleSettingsSave = async (event) => {
        event.preventDefault();
        if (!settingsSession?.id) return;

        try {
            setSavingSettings(true);
            setError('');
            await updateSessionPaymentSettings(settingsSession.id, settingsForm);
            setSettingsSession(null);
            await loadDashboard();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to update payment settings.');
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] px-4 py-8 text-[#f8efe0] sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Global Dashboard</p>
                            <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>All Sessions Overview</h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">Monitor performance across sessions and enter the one you want to operate.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/sessions')}
                                className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-2 text-sm font-semibold text-[#f5dfb3]"
                            >
                                Back to Sessions
                            </button>
                        </div>
                    </div>
                </header>

                <section className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/75 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/75">Filters</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <select
                            value={selectedSessionId}
                            onChange={(event) => setSelectedSessionId(event.target.value)}
                            className="rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black"
                        >
                            <option value="all" className="bg-white text-black">All Sessions</option>
                            {sortedSessions.map((session) => (
                                <option key={session.id} value={session.id} className="bg-white text-black">
                                    {session.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(event) => setDateFrom(event.target.value)}
                            className="rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(event) => setDateTo(event.target.value)}
                            className="rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSessionId('all');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-3 text-sm font-semibold text-[#f5dfb3]"
                        >
                            Clear Filters
                        </button>
                    </div>
                </section>

                {isAdmin && (
                    <form onSubmit={handleCreateSession} className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/75 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/75">Admin Controls</p>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                            <input
                                type="text"
                                value={newSessionName}
                                onChange={(event) => setNewSessionName(event.target.value)}
                                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40 focus:border-[#c9a14a]/60 focus:outline-none"
                                placeholder="Session name (optional): Dinner Shift"
                                maxLength={120}
                            />
                            <button
                                type="submit"
                                disabled={creatingSession}
                                className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#1d1204] disabled:opacity-60"
                            >
                                {creatingSession ? 'Creating...' : 'Create Session'}
                            </button>
                        </div>
                    </form>
                )}

                {error && <div className="rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatsCard label="Total Orders" value={stats.total_orders || 0} />
                    <StatsCard label="Total Revenue" value={`Rs. ${Number(stats.total_revenue || 0).toFixed(2)}`} accent />
                    <StatsCard label="Active Sessions" value={stats.active_sessions || 0} />
                    <StatsCard label="Orders In Kitchen" value={stats.orders_in_kitchen || 0} />
                </section>

                <SalesChart points={trend} />

                {loading ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[#f8efe0]/70">Loading sessions...</div>
                ) : (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {sortedSessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                canManage={isAdmin}
                                joining={joiningSessionId === session.id}
                                stopping={stoppingSessionId === session.id}
                                onEnter={handleEnterSession}
                                onStop={handleStopSession}
                                onOpenSettings={openSettings}
                            />
                        ))}
                    </section>
                )}

                {settingsSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                        <form onSubmit={handleSettingsSave} className="w-full max-w-xl rounded-2xl border border-[#c9a14a]/30 bg-[#0a1628] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Session Settings</p>
                            <h2 className="mt-2 text-2xl font-semibold">{settingsSession.name}</h2>

                            <div className="mt-5 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={settingsForm.allow_cash} onChange={(event) => setSettingsForm((current) => ({ ...current, allow_cash: event.target.checked }))} />
                                    Cash
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={settingsForm.allow_digital} onChange={(event) => setSettingsForm((current) => ({ ...current, allow_digital: event.target.checked }))} />
                                    Digital (Bank, Card)
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={settingsForm.allow_upi} onChange={(event) => setSettingsForm((current) => ({ ...current, allow_upi: event.target.checked, upi_id: event.target.checked ? current.upi_id : '' }))} />
                                    QR Payment (UPI)
                                </label>
                                <input
                                    type="text"
                                    value={settingsForm.upi_id}
                                    onChange={(event) => setSettingsForm((current) => ({ ...current, upi_id: event.target.value }))}
                                    disabled={!settingsForm.allow_upi}
                                    placeholder="UPI ID (e.g. 123@okicici)"
                                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40 focus:border-[#c9a14a]/60 focus:outline-none disabled:opacity-50"
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setSettingsSession(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm">Cancel</button>
                                <button type="submit" disabled={savingSettings} className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-2 text-sm font-semibold text-[#1d1204] disabled:opacity-60">
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

export default GlobalDashboard;
