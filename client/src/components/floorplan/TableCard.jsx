import { useEffect, useState } from 'react';

const TableCard = ({ table, canManage, canToggleStatus, onDuplicate, onDelete, onToggleStatus, onUpdate, onClearBookings, occupiedStyle = 'fill', showBookings = false }) => {
    const status = table.status || (table.is_active ? 'active' : 'inactive');
    const isActive = status === 'active';
    const isOccupied = Boolean(table.is_occupied);
    const bookings = Array.isArray(table.bookings) ? table.bookings : [];
    const [isEditing, setIsEditing] = useState(false);
    const [tableNumber, setTableNumber] = useState(String(table.table_number || ''));
    const [seats, setSeats] = useState(String(table.seats || ''));
    const [saving, setSaving] = useState(false);
    const [clearingBookings, setClearingBookings] = useState(false);

    useEffect(() => {
        setTableNumber(String(table.table_number || ''));
        setSeats(String(table.seats || ''));
    }, [table.table_number, table.seats]);

    const handleSave = async () => {
        if (!onUpdate) return;
        try {
            setSaving(true);
            const ok = await onUpdate(table.id, {
                table_number: Number(tableNumber),
                seats_count: Number(seats)
            });
            if (ok) {
                setIsEditing(false);
            }
        } finally {
            setSaving(false);
        }
    };

    const occupiedClasses = isOccupied
        ? occupiedStyle === 'outline'
            ? 'border-red-400/70 bg-[#0a1628]/75'
            : 'border-red-400/70 bg-red-900/25'
        : 'border-white/10 bg-[#0a1628]/75';

    const handleClearBookings = async () => {
        if (!onClearBookings) return;
        const confirmed = window.confirm(`Clear all bookings and holds for table T-${String(table.table_number).padStart(2, '0')}?`);
        if (!confirmed) return;

        try {
            setClearingBookings(true);
            await onClearBookings(table.id);
        } finally {
            setClearingBookings(false);
        }
    };

    return (
        <article className={`rounded-xl border p-4 shadow-[0_10px_35px_rgba(0,0,0,0.25)] ${occupiedClasses}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#c9a14a]/75">Table</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#f8efe0]">T-{String(table.table_number).padStart(2, '0')}</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${isOccupied ? 'border-red-300/60 bg-red-500/25 text-red-100' : isActive ? 'border-emerald-300/50 bg-emerald-500/20 text-emerald-200' : 'border-zinc-300/45 bg-zinc-700/30 text-zinc-200'}`}>
                    {isOccupied ? 'Occupied' : isActive ? 'Active' : 'Inactive'}
                </span>
            </div>

            {isEditing ? (
                <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div>
                        <label className="text-xs uppercase tracking-[0.14em] text-[#c9a14a]/75">Table Number</label>
                        <input
                            type="number"
                            min="1"
                            value={tableNumber}
                            onChange={(event) => setTableNumber(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-[#081322] px-3 py-2 text-sm text-[#f8efe0] focus:border-[#c9a14a]/60 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-[0.14em] text-[#c9a14a]/75">Seats</label>
                        <input
                            type="number"
                            min="1"
                            value={seats}
                            onChange={(event) => setSeats(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-[#081322] px-3 py-2 text-sm text-[#f8efe0] focus:border-[#c9a14a]/60 focus:outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#1f1201] disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTableNumber(String(table.table_number || ''));
                                setSeats(String(table.seats || ''));
                                setIsEditing(false);
                            }}
                            className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#f8efe0]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#f8efe0]/85">
                    Seats: <span className="font-semibold text-[#f5dfb3]">{table.seats}</span>
                </div>
            )}

            {canToggleStatus && !isEditing && (
                <button
                    type="button"
                    onClick={() => onToggleStatus(table.id, isActive ? 'inactive' : 'active')}
                    className="mt-3 w-full rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#f5dfb3]"
                >
                    Set {isActive ? 'Inactive' : 'Active'}
                </button>
            )}

            {showBookings && bookings.length > 0 && (
                <div className="mt-3 rounded-lg border border-red-300/35 bg-red-950/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-red-200/90">Bookings In Slot</p>
                    <div className="mt-2 space-y-2">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="rounded border border-red-200/20 bg-black/20 p-2 text-xs text-red-100/90">
                                <p className="font-semibold">{booking.name}</p>
                                <p>{booking.phone} · {booking.guests} guests</p>
                                <p>
                                    {new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {' · '}
                                    {booking.duration_minutes || Math.max(1, Math.round((new Date(booking.end) - new Date(booking.start)) / 60000))} mins
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {canManage && showBookings && (
                <button
                    type="button"
                    onClick={handleClearBookings}
                    disabled={clearingBookings}
                    className="mt-3 w-full rounded-lg border border-red-400/45 bg-red-900/25 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-100 disabled:opacity-60"
                >
                    {clearingBookings ? 'Clearing...' : 'Clear Bookings (Test)'}
                </button>
            )}

            {canManage && !isEditing && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded-lg border border-[#c9a14a]/45 bg-[#0d1d35] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#f5dfb3]"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDuplicate(table.id)}
                        className="rounded-lg border border-[#c9a14a]/45 bg-[#0d1d35] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#f5dfb3]"
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(table.id)}
                        className="rounded-lg border border-red-400/45 bg-red-900/25 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-100"
                    >
                        Delete
                    </button>
                </div>
            )}
        </article>
    );
};

export default TableCard;
