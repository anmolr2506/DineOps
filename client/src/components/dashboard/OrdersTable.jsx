import React from 'react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

const statusStyles = {
    pending: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
    approved: 'bg-sky-500/15 text-sky-200 border-sky-400/30',
    paid: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
    preparing: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30',
    completed: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
    cancelled: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
};

const sourceStyles = {
    POS: 'bg-white/10 text-white/70 border-white/10',
    QR: 'bg-[#c9a86a]/15 text-[#f6e7c9] border-[#c9a86a]/20',
};

const OrdersTable = ({ orders = [], loading, title = 'Recent Orders', compact = false }) => {
    return (
        <section id="orders" className="rounded-2xl border border-white/10 bg-[#0c1324] shadow-[0_18px_48px_rgba(0,0,0,0.24)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-[#f4ead8]">{title}</h3>
                    <p className="mt-1 text-sm text-white/45">Live session orders pulled from the database view</p>
                </div>
                <span className="text-xs uppercase tracking-[0.28em] text-white/35">Updated live</span>
            </div>

            <div className={compact ? 'p-4' : 'p-5'}>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                            <tr>
                                <th className="pb-4 pr-4 font-medium">Order ID</th>
                                <th className="pb-4 pr-4 font-medium">Table</th>
                                <th className="pb-4 pr-4 font-medium">Source</th>
                                <th className="pb-4 pr-4 font-medium">Status</th>
                                <th className="pb-4 pr-4 font-medium">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/6">
                            {loading && orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-10 text-center text-white/40">Loading recent orders...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-10 text-center text-white/40">No orders available for this session.</td>
                                </tr>
                            ) : orders.map((order) => (
                                <tr key={order.id} className="hover:bg-white/[0.03] transition-colors">
                                    <td className="py-4 pr-4 font-medium text-[#f5ecdc]">#{order.id}</td>
                                    <td className="py-4 pr-4 text-white/70">Table {order.table_number}</td>
                                    <td className="py-4 pr-4">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${sourceStyles[order.source] || sourceStyles.POS}`}>
                                            {order.source}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[order.status] || statusStyles.pending}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4 font-semibold text-[#f4ead8]">{currencyFormatter.format(Number(order.total_amount || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default OrdersTable;
