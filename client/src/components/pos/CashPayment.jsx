import { useMemo, useState } from 'react';

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const CashPayment = ({ total, onApprove, onInvalidAmount, loading }) => {
    const [received, setReceived] = useState('');

    const receivedValue = Number(received || 0);
    const change = useMemo(() => Number((receivedValue - total).toFixed(2)), [receivedValue, total]);
    const canApprove = Number.isFinite(receivedValue) && receivedValue >= total;

    return (
        <section className="rounded-[28px] border border-white/12 bg-linear-to-br from-[#111827]/95 to-[#0d1425]/95 p-7 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-[#c9a14a]/85">Cash Payment</p>
            <h2 className="mt-1 text-3xl font-semibold text-[#f8efe0]" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                Enter amount received
            </h2>

            <div className="mt-5 rounded-3xl border border-white/15 bg-white/5 px-6 py-5 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[#f8efe0]/55">Amount Due</p>
                <p className="mt-2 text-6xl font-bold text-[#c9a14a]">{currency.format(total)}</p>
            </div>

            <div className="mt-5 rounded-3xl border border-white/15 bg-white/5 p-5">
                <label className="text-xs uppercase tracking-[0.2em] text-[#f8efe0]/65">Amount Received</label>
                <input
                    value={received}
                    onChange={(event) => setReceived(event.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="mt-3 w-full rounded-2xl border border-[#c9a14a]/45 bg-[#2c2f39] px-5 py-4 text-5xl font-semibold tracking-tight text-[#f8efe0] outline-none focus:border-[#c9a14a]"
                />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f8efe0]/80">
                <span>Change to return</span>
                <span className={`text-base font-semibold ${change >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{currency.format(Math.max(0, change))}</span>
            </div>

            <button
                type="button"
                disabled={loading}
                onClick={() => {
                    if (!canApprove) {
                        if (onInvalidAmount) {
                            onInvalidAmount('Cash received must be greater than or equal to amount due.');
                        }
                        return;
                    }
                    onApprove(receivedValue);
                }}
                className="mt-5 w-full rounded-2xl bg-[#b99a45] px-4 py-4 text-3xl font-bold text-[#17110a] transition hover:brightness-105 disabled:opacity-60"
            >
                {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
        </section>
    );
};

export default CashPayment;
