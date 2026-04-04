const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const CartSidebar = ({
    cartItems,
    onChangeQty,
    onClearCart,
    customer,
    onChangeCustomer,
    total,
    selectedTable,
    onFinalize,
    finalizing
}) => {
    return (
        <aside className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Cart</h2>
                <button type="button" onClick={onClearCart} className="text-xs font-semibold uppercase tracking-wide text-[#c9a14a]">Clear</button>
            </div>

            <div className="mt-4 space-y-3 max-h-[38vh] overflow-auto pr-1">
                {cartItems.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/70">No items selected.</div>
                ) : cartItems.map((item) => (
                    <article key={item.line_key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between">
                            <h3 className="text-sm font-semibold text-[#f8efe0]">{item.name}</h3>
                            <p className="text-xs text-[#f5dfb3]">{currency.format(item.price)}</p>
                        </div>
                        {Array.isArray(item.variant_labels) && item.variant_labels.length > 0 && (
                            <div className="mt-1 space-y-0.5 text-[11px] text-[#f8efe0]/65">
                                {item.variant_labels.map((label) => (
                                    <p key={`${item.line_key}-${label}`}>{label}</p>
                                ))}
                            </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => onChangeQty(item.line_key, -1)} className="rounded-md border border-white/15 px-2 py-1 text-sm">-</button>
                                <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                <button type="button" onClick={() => onChangeQty(item.line_key, 1)} className="rounded-md border border-white/15 px-2 py-1 text-sm">+</button>
                            </div>
                            <p className="text-xs text-[#f8efe0]/70">Line: {currency.format(item.quantity * item.price)}</p>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-5 rounded-xl border border-[#c9a14a]/25 bg-[#07111f] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#c9a14a]/80">Customer Details</p>
                <div className="mt-3 space-y-3">
                    <input
                        value={customer.name}
                        onChange={(event) => onChangeCustomer('name', event.target.value)}
                        placeholder="Customer name"
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40"
                    />
                    <input
                        value={customer.phone}
                        onChange={(event) => onChangeCustomer('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Phone (10 digits)"
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40"
                    />
                    {customer.isExisting && (
                        <p className="text-xs text-emerald-300/90">Existing customer found. Name auto-filled.</p>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-[#f8efe0]/70">
                    <span>Selected Table</span>
                    <span className="font-semibold text-[#f8efe0]">{selectedTable ? `T-${String(selectedTable.table_number).padStart(2, '0')}` : 'None'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-[#f8efe0]/70">
                    <span>Total</span>
                    <span className="font-semibold text-[#f5dfb3]">{currency.format(total)}</span>
                </div>

                <button
                    type="button"
                    onClick={onFinalize}
                    disabled={finalizing || cartItems.length === 0 || !selectedTable}
                    className="mt-4 w-full rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-3 text-sm font-semibold text-[#1d1204] disabled:opacity-60"
                >
                    {finalizing ? 'Creating Order...' : 'Finalize & Go To Payment'}
                </button>
            </div>
        </aside>
    );
};

export default CartSidebar;
