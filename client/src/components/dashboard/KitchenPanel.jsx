import React from 'react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

const KitchenPanel = ({ preparation = [], loading, onMarkCompleted, busyOrderId }) => {
    return (
        <section id="kitchen" className="rounded-2xl border border-white/10 bg-[#0c1324] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-[#f4ead8]">Kitchen Panel</h3>
                    <p className="mt-1 text-sm text-white/45">Ongoing preparation and status updates</p>
                </div>
                <span className="text-xs uppercase tracking-[0.28em] text-white/35">Kitchen only</span>
            </div>

            <div className="space-y-4">
                {loading && preparation.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">Loading kitchen queue...</div>
                ) : preparation.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">No orders currently in preparation.</div>
                ) : preparation.map((order) => (
                    <div key={order.order_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm font-semibold text-[#f5ecdc]">Order #{order.order_id}</div>
                                <div className="mt-1 text-sm text-white/50">Table {order.table_number} · {order.source}</div>
                            </div>
                            <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100">
                                {order.status}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                            <div className="text-sm text-white/45">
                                Started {order.created_at ? new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'just now'}
                            </div>
                            <button
                                type="button"
                                onClick={() => onMarkCompleted(order.order_id)}
                                disabled={busyOrderId === order.order_id}
                                className="rounded-full bg-gradient-to-r from-[#9f7736] to-[#c9a86a] px-4 py-2 text-sm font-semibold text-[#120d05] shadow-[0_10px_24px_rgba(201,168,106,0.18)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busyOrderId === order.order_id ? 'Updating...' : 'Mark Completed'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default KitchenPanel;
