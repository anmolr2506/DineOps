import React from 'react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

const metricValue = (value, fallback = '0') => {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }
    return value;
};

const kpiConfig = {
    admin: [
        { key: 'total_orders', label: 'Total Orders', tone: 'blue' },
        { key: 'pending_orders', label: 'Pending Approval', tone: 'amber' },
        { key: 'paid_orders', label: 'Paid Orders', tone: 'emerald' },
        { key: 'today_revenue', label: 'Today Revenue', tone: 'gold', format: 'currency' },
        { key: 'active_tables', label: 'Active Tables', tone: 'slate', extraKey: 'total_tables', format: 'ratio' },
        { key: 'preparing_orders', label: 'Kitchen Load', tone: 'rose' },
    ],
    staff: [
        { key: 'total_orders', label: 'Total Orders', tone: 'blue' },
        { key: 'pending_orders', label: 'Pending Approval', tone: 'amber' },
        { key: 'paid_orders', label: 'Paid Orders', tone: 'emerald' },
        { key: 'active_tables', label: 'Active Tables', tone: 'slate', extraKey: 'total_tables', format: 'ratio' },
        { key: 'today_revenue', label: 'Today Revenue', tone: 'gold', format: 'currency' },
    ],
    kitchen: [
        { key: 'preparing_orders', label: 'Ongoing Preparation', tone: 'rose' },
        { key: 'incoming_orders', label: 'Incoming Orders', tone: 'amber' },
        { key: 'status_updates', label: 'Status Updates', tone: 'blue' },
    ],
};

const toneStyles = {
    blue: 'from-sky-500/20 to-cyan-500/10 border-sky-400/20 text-sky-100',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-400/20 text-amber-50',
    emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/20 text-emerald-50',
    gold: 'from-[#c9a86a]/25 to-[#7f642f]/10 border-[#c9a86a]/25 text-[#f7edd7]',
    slate: 'from-slate-500/20 to-slate-700/10 border-slate-300/20 text-slate-100',
    rose: 'from-rose-500/20 to-pink-500/10 border-rose-400/20 text-rose-50',
};

const KPISection = ({ kpis, role, loading }) => {
    const cards = kpiConfig[role] || kpiConfig.staff;

    return (
        <section id="kpis" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
                const rawValue = kpis?.[card.key];
                const extraValue = card.extraKey ? kpis?.[card.extraKey] : null;
                const displayValue = card.format === 'currency'
                    ? currencyFormatter.format(Number(rawValue || 0))
                    : card.format === 'ratio'
                        ? `${metricValue(rawValue)} / ${metricValue(extraValue)}`
                        : metricValue(rawValue, loading ? '...' : '0');

                return (
                    <article
                        key={card.key}
                        className={`rounded-2xl border bg-gradient-to-br ${toneStyles[card.tone]} shadow-[0_18px_48px_rgba(0,0,0,0.22)] backdrop-blur-sm`}
                    >
                        <div className="p-5 sm:p-6">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">{card.label}</p>
                            <div className="mt-4 flex items-end justify-between gap-4">
                                <div className="text-3xl sm:text-[2rem] font-semibold leading-none text-white">{displayValue}</div>
                                <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/20" />
                            </div>
                        </div>
                    </article>
                );
            })}
        </section>
    );
};

export default KPISection;
