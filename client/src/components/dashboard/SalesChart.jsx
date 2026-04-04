const SalesChart = ({ points = [] }) => {
    const maxValue = Math.max(...points.map((point) => Number(point.revenue || 0)), 1);

    return (
        <section className="rounded-2xl border border-white/10 bg-[#0a1628]/85 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
            <h3 className="text-2xl font-semibold text-[#f8efe0]" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Sales Trend</h3>
            <div className="mt-6 flex h-56 items-end gap-3">
                {points.length === 0 ? (
                    <p className="text-sm text-[#f8efe0]/65">No sales trend data available.</p>
                ) : (
                    points.map((point, index) => {
                        const value = Number(point.revenue || 0);
                        const heightPercent = Math.max((value / maxValue) * 100, 6);
                        const isPeak = value === maxValue;
                        return (
                            <div key={`${point.date}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                                <div
                                    className={`w-full rounded-md ${isPeak ? 'bg-linear-to-t from-[#c9a14a] to-[#ebd39d]' : 'bg-white/20'}`}
                                    style={{ height: `${heightPercent}%` }}
                                />
                                <p className="text-[11px] text-[#f8efe0]/65">{new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default SalesChart;
