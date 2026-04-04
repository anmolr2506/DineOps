import { useMemo, useState } from 'react';

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const MenuView = ({ categories, products, onAdd }) => {
    const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();
        return products.filter((product) => {
            const byCategory = selectedCategoryId === 'all' || Number(product.category_id) === Number(selectedCategoryId);
            const bySearch = !term
                || String(product.name || '').toLowerCase().includes(term)
                || String(product.category_name || '').toLowerCase().includes(term)
                || String(product.description || '').toLowerCase().includes(term);
            return byCategory && bySearch;
        });
    }, [products, search, selectedCategoryId]);

    return (
        <section className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Step 3: Build Menu</p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40 focus:border-[#c9a14a]/60 focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => setSelectedCategoryId('all')}
                    className={`rounded-lg px-4 py-3 text-sm font-semibold ${selectedCategoryId === 'all' ? 'bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] text-[#1d1204]' : 'border border-white/15 text-[#f8efe0]/75'}`}
                >
                    All
                </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                            Number(selectedCategoryId) === Number(category.id)
                                ? 'bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] text-[#1d1204]'
                                : 'border border-white/15 text-[#f8efe0]/70 hover:border-[#c9a14a]/40'
                        }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                    const base = Number(product.price || 0);
                    const taxPercent = Number(product.tax_percent || 0);
                    const unitPrice = base + (base * taxPercent / 100);

                    return (
                        <article key={product.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-[#f8efe0]">{product.name}</h3>
                                    <p className="mt-1 text-xs text-[#f8efe0]/60">{product.category_name || 'Uncategorized'}</p>
                                </div>
                                <p className="text-xs font-semibold text-[#f5dfb3]">{currency.format(unitPrice)}</p>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs text-[#f8efe0]/65">{product.description || 'No description available.'}</p>
                            <button
                                type="button"
                                onClick={() => onAdd(product)}
                                className="mt-3 w-full rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#1d1204]"
                            >
                                Add / Customize
                            </button>
                        </article>
                    );
                })}
                {filteredProducts.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-[#f8efe0]/70">
                        No products found for current filters.
                    </div>
                )}
            </div>
        </section>
    );
};

export default MenuView;
