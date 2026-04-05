const CartPanel = ({ open, items, onClose, onIncrement, onDecrement, onRemove, total, onProceed }) => {
    return (
        <div className={`fixed inset-0 z-50 transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div
                className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            <div
                className={`absolute bottom-0 left-1/2 w-full max-w-120 -translate-x-1/2 rounded-t-4xl border border-[#C9A14A]/30 bg-[rgba(8,16,30,0.98)] p-4 pb-6 shadow-[0_-12px_45px_rgba(0,0,0,0.45)] transition-transform duration-300 ${
                    open ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-[1.5rem] font-semibold text-[#f8efe0]">Your Cart</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-white/12 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#f8efe0]/80"
                    >
                        Close
                    </button>
                </div>

                {items.length === 0 ? (
                    <p className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/70">No items in cart.</p>
                ) : (
                    <div className="max-h-[45vh] space-y-2 overflow-auto pr-1">
                        {items.map((item) => (
                            <div key={item.product_id} className="rounded-[1.1rem] border border-white/10 bg-white/5 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-[#f8efe0]">{item.name}</p>
                                        <p className="text-xs text-[#f8efe0]/65">Rs. {Number(item.price).toFixed(2)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(item.product_id)}
                                        className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-red-300"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onDecrement(item.product_id)}
                                        className="rounded-md border border-white/15 px-2 py-1 text-xs"
                                    >
                                        -
                                    </button>
                                    <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => onIncrement(item.product_id)}
                                        className="rounded-md border border-white/15 px-2 py-1 text-xs"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 rounded-[1.1rem] border border-[#C9A14A]/20 bg-[#111c31]/95 p-3">
                    <div className="flex items-center justify-between text-sm text-[#f8efe0]">
                        <span>Total</span>
                        <span className="font-bold text-[#f2d9a8]">Rs. {total.toFixed(2)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onProceed}
                        disabled={items.length === 0}
                        className="mt-3 w-full rounded-[1rem] bg-linear-to-r from-[#C9A14A] to-[#d8b15f] px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#1b1306] disabled:opacity-50"
                    >
                        Proceed to Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPanel;
