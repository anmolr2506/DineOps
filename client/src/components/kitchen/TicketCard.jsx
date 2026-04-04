import React, { useMemo } from 'react';
import ItemRow from './ItemRow';

const TicketCard = React.memo(function TicketCard({ order, onStartPreparing, onTogglePrepared, onMarkServed }) {
    const allPrepared = useMemo(() => order.items.length > 0 && order.items.every((item) => item.is_prepared), [order.items]);
    const pendingCount = useMemo(() => order.items.filter((item) => !item.is_prepared).length, [order.items]);

    return (
        <article
            onClick={() => {
                if (order.status === 'received') {
                    onStartPreparing(order.id);
                }
            }}
            className={`group h-120 rounded-2xl border bg-slate-950/40 p-4 backdrop-blur-md transition ${
                order.status === 'preparing'
                    ? 'border-[#C9A14A] shadow-[0_0_22px_rgba(201,161,74,0.24)]'
                    : 'border-slate-700/60 hover:border-[#C9A14A]/60'
            }`}
        >
            <header className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Order</p>
                    <h3 className="text-xl font-bold text-white">#{order.id}</h3>
                    <p className="text-xs text-slate-400">Table {order.table_id || 'N/A'}</p>
                </div>

                <div className="text-right">
                    <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] ${
                            order.status === 'received'
                                ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                                : order.status === 'preparing'
                                ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                                : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                        }`}
                    >
                        {order.status}
                    </span>
                    <p className="mt-1 text-xs text-slate-400">{pendingCount} pending items</p>
                </div>
            </header>

            <div className="space-y-2">
                {order.items.map((item) => (
                    <div key={item.id} onClick={(event) => event.stopPropagation()}>
                        <ItemRow item={item} onTogglePrepared={onTogglePrepared} />
                    </div>
                ))}
            </div>

            {order.status === 'preparing' && allPrepared && (
                <div className="mt-4" onClick={(event) => event.stopPropagation()}>
                    <button
                        type="button"
                        onClick={() => onMarkServed(order.id)}
                        className="w-full rounded-xl border border-[#C9A14A] bg-linear-to-r from-amber-500 to-yellow-500 px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 transition hover:brightness-110"
                    >
                        Mark as Served
                    </button>
                </div>
            )}
        </article>
    );
});

export default TicketCard;
