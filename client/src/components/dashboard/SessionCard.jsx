const SessionCard = ({ session, canManage, joining, stopping, onEnter, onStop, onOpenSettings }) => {
    return (
        <article className="rounded-2xl border border-white/10 bg-[#0a1628]/85 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-[#f8efe0]">{session.name}</h3>
                    <p className="mt-1 text-xs text-[#f8efe0]/65">Started: {new Date(session.start_time).toLocaleString()}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${session.status === 'active' ? 'border-emerald-300/50 bg-emerald-500/20 text-emerald-200' : 'border-zinc-300/40 bg-zinc-500/15 text-zinc-200'}`}>
                    {session.status}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-[#f8efe0]/50">Revenue</p>
                    <p className="mt-1 font-semibold text-[#e7c98b]">Rs. {Number(session.revenue || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-[#f8efe0]/50">Orders</p>
                    <p className="mt-1 font-semibold text-[#f8efe0]">{session.order_count || 0}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onEnter(session.id)}
                    disabled={joining || session.status !== 'active'}
                    className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#1d1204] disabled:opacity-50"
                >
                    {joining ? 'Entering...' : 'Enter Session'}
                </button>

                {canManage && (
                    <button
                        type="button"
                        onClick={() => onOpenSettings(session)}
                        className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#f5dfb3]"
                    >
                        Settings
                    </button>
                )}

                {canManage && session.status === 'active' && (
                    <button
                        type="button"
                        onClick={() => onStop(session.id)}
                        disabled={stopping}
                        className="rounded-lg border border-red-400/45 bg-red-900/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-100 disabled:opacity-50"
                    >
                        {stopping ? 'Stopping...' : 'Stop'}
                    </button>
                )}
            </div>
        </article>
    );
};

export default SessionCard;
