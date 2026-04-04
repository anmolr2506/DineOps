import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';

const buildDefaultSlot = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    now.setSeconds(0, 0);

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`
    };
};

const generateHoldToken = () => {
    const existing = sessionStorage.getItem('customer_hold_token');
    if (existing) return existing;

    const token = `hold_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem('customer_hold_token', token);
    return token;
};

const CustomerReservationPage = () => {
    const navigate = useNavigate();
    const holdTokenRef = useRef(generateHoldToken());
    const socketRef = useRef(null);

    const defaultSlot = useMemo(() => buildDefaultSlot(), []);

    const [form, setForm] = useState({
        name: '',
        phone: '',
        date: defaultSlot.date,
        time: defaultSlot.time,
        guests: '2'
    });
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedDurationHours, setSelectedDurationHours] = useState('2');
    const [floors, setFloors] = useState([]);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [holdExpiresAt, setHoldExpiresAt] = useState(null);
    const [holdRemainingSeconds, setHoldRemainingSeconds] = useState(0);

    const durationMinutes = Number(selectedDurationHours) * 60;

    const loadFloorPlan = async () => {
        try {
            setLoadingPlan(true);
            const response = await axios.get(`${API_BASE}/customer/floor-plan`, {
                params: {
                    date: form.date,
                    time: form.time,
                    duration_minutes: durationMinutes,
                    hold_token: holdTokenRef.current
                }
            });
            setFloors(response.data.floors || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load floor plan.');
        } finally {
            setLoadingPlan(false);
        }
    };

    const releaseHold = async () => {
        try {
            await axios.delete(`${API_BASE}/customer/table-holds`, {
                data: { hold_token: holdTokenRef.current }
            });
            setHoldExpiresAt(null);
            setHoldRemainingSeconds(0);
        } catch {
            // Best-effort release; ignore network race on unload.
        }
    };

    useEffect(() => {
        loadFloorPlan();
    }, [form.date, form.time, selectedDurationHours]);

    useEffect(() => {
        if (!holdExpiresAt) {
            setHoldRemainingSeconds(0);
            return;
        }

        const tick = () => {
            const remaining = Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000));
            setHoldRemainingSeconds(remaining);
            if (remaining === 0) {
                setSelectedTable(null);
                setHoldExpiresAt(null);
                setError('Table hold expired. Please select the table again.');
                loadFloorPlan();
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [holdExpiresAt]);

    useEffect(() => {
        const socket = io('http://localhost:5000', {
            autoConnect: true,
            transports: ['websocket']
        });
        socketRef.current = socket;

        const onReservationChange = () => {
            loadFloorPlan();
        };

        socket.on('table_reservation_changed', onReservationChange);
        return () => {
            socket.off('table_reservation_changed', onReservationChange);
            socket.disconnect();
            socketRef.current = null;
            releaseHold();
        };
    }, []);

    useEffect(() => {
        if (!selectedTable) return;

        const stillAvailable = floors.some((floor) =>
            (floor.tables || []).some((table) => table.id === selectedTable.id && !table.is_unavailable)
        );

        if (!stillAvailable) {
            setSelectedTable(null);
        }
    }, [floors, selectedTable]);

    const handleChange = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
        setError('');
        setSuccess('');

        if (key === 'date' || key === 'time') {
            setSelectedTable(null);
            releaseHold();
        }
    };

    const handleTableSelect = async (table) => {
        if (table.is_unavailable || !table.is_active) return;

        try {
            setError('');
            setSuccess('');

            const holdResponse = await axios.post(`${API_BASE}/customer/table-holds`, {
                table_id: table.id,
                date: form.date,
                time: form.time,
                duration_minutes: durationMinutes,
                hold_token: holdTokenRef.current
            });

            setSelectedTable(table);
            setHoldExpiresAt(holdResponse.data?.hold?.expires_at || null);
            await loadFloorPlan();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to lock selected table. Please choose another one.');
            setSelectedTable(null);
            setHoldExpiresAt(null);
            await loadFloorPlan();
        }
    };

    const validate = () => {
        if (!form.name.trim()) return 'Name is required.';
        if (!/^\d{10}$/.test(form.phone.trim())) return 'Phone must be a valid 10-digit number.';
        if (!form.date) return 'Date is required.';
        if (!form.time) return 'Time is required.';
        if (!form.guests || Number(form.guests) <= 0) return 'Guests must be greater than 0.';
        if (!selectedTable) return 'Please select an available table.';
        return '';
    };

    const submitReservation = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`${API_BASE}/customer/reservations`, {
                name: form.name,
                phone: form.phone,
                date: form.date,
                time: form.time,
                duration_minutes: durationMinutes,
                guests: Number(form.guests),
                table_id: selectedTable.id,
                hold_token: holdTokenRef.current
            });

            setSuccess('Reservation confirmed successfully. You will receive a confirmation call shortly.');
            setForm((current) => ({ ...current, name: '', phone: '', guests: '2' }));
            setSelectedTable(null);
            setHoldExpiresAt(null);
            await loadFloorPlan();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to confirm reservation. Please try again.');
            await loadFloorPlan();
        } finally {
            setSubmitting(false);
        }
    };

    const availableTableCount = useMemo(() => {
        return floors.reduce((sum, floor) => {
            const available = (floor.tables || []).filter((table) => !table.is_unavailable && table.is_active).length;
            return sum + available;
        }, 0);
    }, [floors]);

    const holdTimerLabel = useMemo(() => {
        const mins = Math.floor(holdRemainingSeconds / 60);
        const secs = holdRemainingSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, [holdRemainingSeconds]);

    return (
        <div className="min-h-screen bg-linear-to-br from-[#040a16] via-[#0b1a30] to-[#132745] px-4 py-8 text-[#f8efe0] sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="rounded-2xl border border-[#c9a14a]/25 bg-[#0a1628]/85 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.4)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-[#c9a14a]/85">Customer Reservation</p>
                            <h1 className="mt-2 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Reserve Table</h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">Shared live floor plan with real-time table locking.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-2 text-sm font-semibold text-[#f5dfb3]"
                        >
                            Back Home
                        </button>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-2xl border border-white/10 bg-[#0a1628]/80 p-5">
                        <h2 className="text-2xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Reservation Details</h2>
                        <form onSubmit={submitReservation} className="mt-4 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">Name</label>
                                    <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm focus:border-[#c9a14a]/60 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">Phone</label>
                                    <input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm focus:border-[#c9a14a]/60 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">Date</label>
                                    <input type="date" value={form.date} onChange={(event) => handleChange('date', event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm focus:border-[#c9a14a]/60 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">Time</label>
                                    <input type="time" value={form.time} onChange={(event) => handleChange('time', event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm focus:border-[#c9a14a]/60 focus:outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">Guests</label>
                                <input type="number" min="1" value={form.guests} onChange={(event) => handleChange('guests', event.target.value)} className="mt-2 w-full max-w-55 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm focus:border-[#c9a14a]/60 focus:outline-none" />
                            </div>

                            <div>
                                <label className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">Duration (Hours)</label>
                                <select
                                    value={selectedDurationHours}
                                    onChange={(event) => {
                                        setSelectedDurationHours(event.target.value);
                                        setSelectedTable(null);
                                        releaseHold();
                                    }}
                                    className="mt-2 w-full max-w-55 rounded-lg border border-white/15 bg-white px-3 py-2 text-sm text-black"
                                >
                                    <option value="1">1 hour</option>
                                    <option value="2">2 hours</option>
                                    <option value="3">3 hours</option>
                                </select>
                            </div>

                            {selectedTable && holdRemainingSeconds > 0 && (
                                <p className="rounded-lg border border-[#c9a14a]/35 bg-[#c9a14a]/12 p-3 text-sm text-[#f7e3ba]">
                                    Table {`T-${String(selectedTable.table_number).padStart(2, '0')}`} is held for you: {holdTimerLabel}
                                </p>
                            )}

                            {error && <p className="rounded-lg border border-red-400/45 bg-red-900/25 p-3 text-sm text-red-100">{error}</p>}
                            {success && <p className="rounded-lg border border-[#c9a14a]/35 bg-[#c9a14a]/12 p-3 text-sm text-[#f7e3ba]">{success}</p>}

                            <button type="submit" disabled={submitting} className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#1f1201] disabled:opacity-60">
                                {submitting ? 'Confirming...' : 'Confirm Reservation'}
                            </button>
                        </form>
                    </section>

                    <aside className="rounded-2xl border border-[#c9a14a]/25 bg-[#0a1628]/85 p-5">
                        <h2 className="text-2xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Floor Plan</h2>
                        <p className="mt-2 text-sm text-[#f8efe0]/70">Available now: {availableTableCount} tables</p>

                        {loadingPlan ? (
                            <p className="mt-4 text-sm text-[#f8efe0]/70">Refreshing live table availability...</p>
                        ) : (
                            <div className="mt-4 space-y-4">
                                {floors.map((floor) => (
                                    <div key={floor.id}>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c9a14a]/78">{floor.name}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(floor.tables || []).map((table) => {
                                                const selected = selectedTable?.id === table.id;
                                                const unavailable = table.is_unavailable || !table.is_active;

                                                return (
                                                    <button
                                                        key={table.id}
                                                        type="button"
                                                        disabled={unavailable}
                                                        onClick={() => handleTableSelect(table)}
                                                        className={`rounded-xl border p-3 text-left transition ${selected ? 'border-[#c9a14a]/75 bg-[#c9a14a]/16' : unavailable ? 'border-red-400/65 bg-white/5 text-[#f8efe0]/65' : 'border-white/15 bg-white/5 hover:border-[#c9a14a]/35'} ${unavailable ? 'cursor-not-allowed' : ''}`}
                                                    >
                                                        <p className="text-sm font-semibold text-[#f2d9a8]">T-{String(table.table_number).padStart(2, '0')}</p>
                                                        <p className="text-xs text-[#f8efe0]/70">{table.seats} seats</p>
                                                        {unavailable && (
                                                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-red-300">Booked</p>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CustomerReservationPage;
