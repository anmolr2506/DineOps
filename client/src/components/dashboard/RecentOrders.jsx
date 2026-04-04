const statusStyles = {
    paid: 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200',
    pending: 'border-amber-300/35 bg-amber-500/20 text-amber-200',
    approved: 'border-sky-300/35 bg-sky-500/20 text-sky-200',
    preparing: 'border-fuchsia-300/35 bg-fuchsia-500/20 text-fuchsia-200',
    completed: 'border-zinc-300/35 bg-zinc-500/20 text-zinc-200'
};

const RecentOrders = ({ orders = [] }) => {
    return (
        <section className="rounded-2xl border border-white/10 bg-[#0a1628]/85 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <h3 className="text-2xl font-semibold text-[#f8efe0]" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Recent Orders</h3>
            </header>
            <div className="overflow-x-auto">
                <table className="w-full min-w-160 text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">
                        <tr>
                            <th className="px-5 py-3">Order</th>
                            <th className="px-5 py-3">Table</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Amount</th>
                            <th className="px-5 py-3">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td className="px-5 py-5 text-[#f8efe0]/65" colSpan={5}>No recent orders.</td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="border-t border-white/10">
                                    <td className="px-5 py-4 font-semibold text-[#f8efe0]">#ORD-{order.id}</td>
                                    <td className="px-5 py-4 text-[#f8efe0]/80">Table {order.table_number || '-'}</td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusStyles[order.status] || statusStyles.completed}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-[#e7c98b]">Rs. {Number(order.total_amount || 0).toFixed(2)}</td>
                                    <td className="px-5 py-4 text-[#f8efe0]/70">{new Date(order.created_at).toLocaleTimeString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default RecentOrders;
