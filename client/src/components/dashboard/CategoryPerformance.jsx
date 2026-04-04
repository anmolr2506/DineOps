import React from 'react';

const CategoryPerformance = ({ categories = [], loading }) => {
    return (
        <section className="rounded-2xl border border-white/10 bg-[#0c1324] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-[#f4ead8]">Category Performance</h3>
                    <p className="mt-1 text-sm text-white/45">Revenue distribution by category</p>
                </div>
            </div>

            <div className="space-y-4">
                {loading && categories.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">Loading category performance...</div>
                ) : categories.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">No category performance data available.</div>
                ) : categories.map((category) => (
                    <div key={category.category} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="font-medium text-[#f5ecdc]">{category.category}</span>
                            <span className="text-white/55">{Number(category.percentage || 0).toFixed(2)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#8f6a33] to-[#c9a86a]"
                                style={{ width: `${Math.max(0, Math.min(100, Number(category.percentage || 0)))}%` }}
                            />
                        </div>
                        <div className="text-xs text-white/40">{Number(category.revenue || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} revenue</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CategoryPerformance;
