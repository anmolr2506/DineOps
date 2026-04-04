import React from 'react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

const TopProducts = ({ products = [], loading }) => {
    return (
        <section className="rounded-2xl border border-white/10 bg-[#0c1324] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-[#f4ead8]">Top Products</h3>
                    <p className="mt-1 text-sm text-white/45">Highest performing items in this session</p>
                </div>
            </div>

            <div className="space-y-4">
                {loading && products.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">Loading top products...</div>
                ) : products.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">No product data available.</div>
                ) : products.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a86a]/15 text-sm font-semibold text-[#f7edd7]">
                            {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-[#f5ecdc]">{product.name}</div>
                            <div className="mt-1 text-xs text-white/45">{product.total_sold} sold</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-[#f5ecdc]">{currencyFormatter.format(Number(product.revenue || 0))}</div>
                            <div className="mt-1 text-xs text-white/45">Revenue</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TopProducts;
