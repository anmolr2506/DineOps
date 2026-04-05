const CartBar = ({ visible, itemCount, total, onOpen }) => {
    return (
        <div
            className={`fixed bottom-0 left-1/2 z-40 w-full max-w-120 -translate-x-1/2 px-3 pb-3 transition-transform duration-300 ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
            }`}
        >
            <button
                type="button"
                onClick={onOpen}
                className="w-full rounded-[1.35rem] border border-[#C9A14A]/22 bg-[rgba(9,15,28,0.96)] px-4 py-3 text-left shadow-[0_10px_35px_rgba(0,0,0,0.42)] backdrop-blur-sm"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-body text-[0.68rem] uppercase tracking-[0.28em] text-[#C9A14A]">Cart</p>
                        <p className="text-sm font-semibold text-[#f8efe0]">{itemCount} items</p>
                    </div>
                    <div className="text-right">
                        <p className="font-body text-[0.68rem] uppercase tracking-[0.24em] text-[#f8efe0]/65">Total</p>
                        <p className="text-base font-bold text-[#f2d9a8]">Rs. {total.toFixed(2)}</p>
                    </div>
                </div>
            </button>
        </div>
    );
};

export default CartBar;
