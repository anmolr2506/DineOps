import React from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';

const CardShell = ({ title, subtitle, children }) => (
    <section className="rounded-2xl border border-white/10 bg-[#0c1324] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
        <div className="mb-4 flex items-start justify-between gap-4">
            <div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#f4ead8]">{title}</h3>
                {subtitle ? <p className="mt-1 text-sm text-white/45">{subtitle}</p> : null}
            </div>
        </div>
        {children}
    </section>
);

const chartTooltipStyle = {
    backgroundColor: '#090d18',
    border: '1px solid rgba(201, 168, 106, 0.25)',
    borderRadius: 12,
    color: '#f4ead8',
};

const RevenueChart = ({ revenueTrend = [], dailySales = [] }) => {
    const revenueData = revenueTrend.map((item) => ({
        ...item,
        label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    const salesData = dailySales.map((item) => ({
        ...item,
        label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    return (
        <section id="analytics" className="grid gap-4 xl:grid-cols-2">
            <CardShell title="Revenue Trend" subtitle="Completed payments across the active session">
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                            <XAxis dataKey="label" tick={{ fill: '#a7afc4', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#a7afc4', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#f4ead8' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#c9a86a" strokeWidth={3} dot={{ r: 3, fill: '#c9a86a' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardShell>

            <CardShell title="Daily Sales" subtitle="Paid orders and sales volume by day">
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                            <XAxis dataKey="label" tick={{ fill: '#a7afc4', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#a7afc4', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#f4ead8' }} />
                            <Bar dataKey="total_sales" radius={[8, 8, 0, 0]} fill="url(#goldGradient)" />
                            <defs>
                                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#c9a86a" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#6d5531" stopOpacity={0.9} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardShell>
        </section>
    );
};

export default RevenueChart;
