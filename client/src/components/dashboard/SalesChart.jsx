import { useMemo, useState } from 'react';

const formatRevenue = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const toLocalDateKey = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SalesChart = ({ points = [] }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const maxValue = Math.max(...points.map((point) => Number(point.revenue || 0)), 1);

    const todayKey = useMemo(() => toLocalDateKey(new Date()), []);

    const axisTicks = useMemo(() => {
        return [100, 75, 50, 25, 0].map((percent) => ({
            percent,
            value: Number(((maxValue * percent) / 100).toFixed(2))
        }));
    }, [maxValue]);

    return (
        <section className="rounded-2xl border border-white/10 bg-[#0a1628]/85 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
            <h3 className="text-2xl font-semibold text-[#f8efe0]" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Sales Trend</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#f8efe0]/55">Y-axis: Revenue (Rs.)</p>

            <div className="mt-4 h-64">
                {points.length === 0 ? (
                    <p className="text-sm text-[#f8efe0]/65">No sales trend data available.</p>
                ) : (
                    <div className="grid h-full grid-cols-[56px_1fr] gap-3">
                        <div className="relative h-full">
                            {axisTicks.map((tick) => (
                                <p
                                    key={tick.percent}
                                    className="absolute right-0 translate-y-1/2 text-[10px] text-[#f8efe0]/55"
                                    style={{ bottom: `${tick.percent}%` }}
                                >
                                    {formatRevenue(tick.value)}
                                </p>
                            ))}
                        </div>

                        <div className="relative h-full">
                            {axisTicks.map((tick) => (
                                <div
                                    key={`line-${tick.percent}`}
                                    className="pointer-events-none absolute left-0 right-0 border-t border-white/10"
                                    style={{ bottom: `${tick.percent}%` }}
                                />
                            ))}

                            <div className="flex h-full items-end gap-3">
                                {points.map((point, index) => {
                                    const value = Number(point.revenue || 0);
                                    const dateLabel = new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                    const heightPercent = value > 0 ? Math.max((value / maxValue) * 100, 8) : 0;
                                    const isToday = toLocalDateKey(point.date) === todayKey;
                                    const isHovered = hoveredIndex === index;

                                    return (
                                        <div
                                            key={`${point.date}-${index}`}
                                            className="relative flex h-full flex-1 flex-col justify-end"
                                            onMouseEnter={() => setHoveredIndex(index)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                        >
                                            {isHovered && (
                                                <div className="absolute -top-16 left-1/2 z-10 w-40 -translate-x-1/2 rounded-lg border border-[#c9a14a]/45 bg-[#061325]/95 px-3 py-2 text-[11px] text-[#f8efe0] shadow-[0_10px_20px_rgba(0,0,0,0.35)]">
                                                    <p className="font-semibold text-[#f5dfb3]">{dateLabel}</p>
                                                    <p className="mt-1 text-[#f8efe0]/80">Revenue: {formatRevenue(value)}</p>
                                                </div>
                                            )}

                                            <div
                                                className={`w-full rounded-md transition-all ${
                                                    isToday
                                                        ? 'border border-[#f3cf8b]/80 bg-linear-to-t from-[#c9a14a] to-[#ebd39d] shadow-[0_0_20px_rgba(233,194,121,0.45)]'
                                                        : 'bg-white/20'
                                                }`}
                                                style={{ height: `${heightPercent}%` }}
                                            />

                                            <p className={`mt-2 text-center text-[11px] ${isToday ? 'font-semibold text-[#f5dfb3]' : 'text-[#f8efe0]/65'}`}>
                                                {dateLabel}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <p className="mt-3 text-center text-xs uppercase tracking-[0.14em] text-[#f8efe0]/55">X-axis: Date</p>
        </section>
    );
};

export default SalesChart;
