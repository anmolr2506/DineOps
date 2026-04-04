import React from 'react';
import SearchBar from './SearchBar';

const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'received', label: 'To Cook' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'served', label: 'Completed' }
];

const FilterPanel = React.memo(function FilterPanel({
    status,
    onStatusChange,
    search,
    onSearchChange,
    selectedProduct,
    onProductChange,
    selectedCategory,
    onCategoryChange,
    products,
    categories
}) {
    return (
        <aside className="rounded-2xl border border-[#C9A14A]/30 bg-slate-950/50 p-4 backdrop-blur-md">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A14A]">Filters</h2>

            <div className="mb-4 grid gap-2">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onStatusChange(tab.key)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                            status === tab.key
                                ? 'border-[#C9A14A] bg-[#C9A14A]/20 text-amber-100 shadow-[0_0_20px_rgba(201,161,74,0.2)]'
                                : 'border-slate-700/70 bg-slate-900/60 text-slate-300 hover:border-[#C9A14A]/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mb-3">
                <label className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">Product</label>
                <select
                    value={selectedProduct}
                    onChange={(event) => onProductChange(event.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-[#C9A14A]"
                >
                    <option value="">All Products</option>
                    {products.map((product) => (
                        <option key={product} value={product}>
                            {product}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">Category</label>
                <select
                    value={selectedCategory}
                    onChange={(event) => onCategoryChange(event.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-[#C9A14A]"
                >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            <SearchBar value={search} onChange={onSearchChange} />
        </aside>
    );
});

export default FilterPanel;
