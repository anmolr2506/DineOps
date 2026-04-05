import { useState } from 'react';

const fallbackImage =
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80';

const CategoryCard = ({
    category,
    products,
    loadingProducts,
    canManage,
    onLoadProducts,
    onAddProduct,
    onEditProduct,
    onEditCategory,
    onDeleteCategory
}) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = () => {
        if (!expanded) {
            onLoadProducts(category.id);
        }
        setExpanded((prev) => !prev);
    };

    return (
        <article className="rounded-2xl border border-[#c9a14a]/20 bg-[#0c1b32]/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                    <img
                        src={category.image_url || fallbackImage}
                        alt={category.name}
                        onError={(event) => {
                            event.currentTarget.src = fallbackImage;
                        }}
                        className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div>
                        <h3 className="text-xl font-semibold text-[#f8efe0]">{category.name}</h3>
                        <p className="mt-1 text-sm text-[#f8efe0]/70">{category.description || 'No description available.'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                            <span className="rounded-full border border-[#c9a14a]/30 bg-[#c9a14a]/10 px-3 py-1 text-[#f0d8aa]">
                                Products: {category.product_count}
                            </span>
                            {Array.isArray(category.variant_groups) && category.variant_groups.length > 0 && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[#f8efe0]/75">
                                    Variant Groups: {category.variant_groups.map((group) => group.name).join(', ')}
                                </span>
                            )}
                            <span
                                className={`rounded-full px-3 py-1 ${
                                    category.status === 'active'
                                        ? 'border border-emerald-300/50 bg-emerald-500/15 text-emerald-200'
                                        : 'border border-zinc-300/40 bg-zinc-500/10 text-zinc-300'
                                }`}
                            >
                                {category.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={toggleExpanded}
                        className="rounded-lg border border-[#c9a14a]/30 px-3 py-2 text-xs font-semibold text-[#f5dfb3]"
                    >
                        {expanded ? 'Hide Products' : 'View Products'}
                    </button>
                    {canManage && (
                        <>
                            <button
                                type="button"
                                onClick={() => onAddProduct(category)}
                                className="rounded-lg bg-[#183455] px-3 py-2 text-xs font-semibold text-[#f5dfb3]"
                            >
                                Add Product
                            </button>
                            <button
                                type="button"
                                onClick={() => onEditCategory(category)}
                                className="rounded-lg border border-[#c9a14a]/30 px-3 py-2 text-xs font-semibold text-[#f5dfb3]"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => onDeleteCategory(category.id)}
                                className="rounded-lg border border-red-400/50 bg-red-900/30 px-3 py-2 text-xs font-semibold text-red-100"
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/3 p-3">
                    {loadingProducts ? (
                        <p className="text-sm text-[#f8efe0]/70">Loading products...</p>
                    ) : products.length === 0 ? (
                        <p className="text-sm text-[#f8efe0]/70">No products in this category yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {products.map((product) => (
                                <div key={product.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1a2f] px-3 py-2">
                                    <div>
                                        <p className="text-sm font-semibold text-[#f8efe0]">{product.name}</p>
                                        <p className="text-xs text-[#f8efe0]/65">{product.description || 'No description'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-semibold text-[#eacb8e]">Rs. {Number(product.price).toFixed(2)}</p>
                                        {canManage && (
                                            <button
                                                type="button"
                                                onClick={() => onEditProduct(category, product)}
                                                className="rounded-md border border-[#c9a14a]/30 px-2 py-1 text-xs font-semibold text-[#f5dfb3]"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
};

export default CategoryCard;
