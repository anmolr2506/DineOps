import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import SessionBadge from '../components/SessionBadge';
import VariantSelectionModal from '../components/pos/VariantSelectionModal';

const API_BASE = 'http://localhost:5000/api';

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const PosPage = () => {
    const { user } = useAuth();
    const { currentSession } = useSession();
    const sessionId = Number(localStorage.getItem('session_id'));

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [cartItems, setCartItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);

    const hasSession = Number.isInteger(sessionId) && sessionId > 0;

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const [categoriesResponse, productsResponse] = await Promise.all([
                axios.get(`${API_BASE}/categories`, { params: { session_id: sessionId, limit: 100 } }),
                axios.get(`${API_BASE}/products`, { params: { session_id: sessionId } })
            ]);

            setCategories(categoriesResponse.data.categories || []);
            setProducts(productsResponse.data.products || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to load menu data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasSession) return;
        fetchData();
    }, [hasSession, sessionId]);

    const categoryLookup = useMemo(() => {
        return categories.reduce((accumulator, category) => {
            accumulator[category.id] = category;
            return accumulator;
        }, {});
    }, [categories]);

    const filteredProducts = useMemo(() => {
        const lowerSearch = search.trim().toLowerCase();
        return products.filter((product) => {
            const matchesSearch = !lowerSearch
                || product.name?.toLowerCase().includes(lowerSearch)
                || product.description?.toLowerCase().includes(lowerSearch)
                || product.category_name?.toLowerCase().includes(lowerSearch);
            const matchesCategory = selectedCategoryId === 'all' || Number(product.category_id) === Number(selectedCategoryId);
            return matchesSearch && matchesCategory;
        });
    }, [products, search, selectedCategoryId]);

    const cartTotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    }, [cartItems]);

    const handleProductClick = (product) => {
        const category = categoryLookup[product.category_id];
        const hasVariants = Array.isArray(category?.variant_groups) && category.variant_groups.length > 0;

        if (!hasVariants) {
            addToCart({
                product,
                category,
                selections: [],
                extraTotal: 0,
                finalUnitPrice: Number(product.price || 0)
            });
            return;
        }

        setSelectedProduct(product);
        setSelectedCategory(category);
        setShowVariantModal(true);
    };

    const addToCart = ({ product, category, selections, finalUnitPrice, extraTotal }) => {
        const selectionKey = JSON.stringify({ productId: product.id, selections: selections.map((item) => ({ groupId: item.groupId, valueId: item.valueId })) });
        setCartItems((current) => {
            const existingIndex = current.findIndex((item) => item.selectionKey === selectionKey);
            if (existingIndex >= 0) {
                const nextItems = [...current];
                const existingItem = nextItems[existingIndex];
                existingItem.quantity += 1;
                existingItem.lineTotal = existingItem.quantity * existingItem.unitPrice;
                return nextItems;
            }

            const unitPrice = Number(finalUnitPrice || product.price || 0);
            return [
                ...current,
                {
                    selectionKey,
                    productId: product.id,
                    productName: product.name,
                    categoryName: category?.name || categoryLookup[product.category_id]?.name || '',
                    quantity: 1,
                    basePrice: Number(product.price || 0),
                    extraTotal: Number(extraTotal || 0),
                    unitPrice,
                    lineTotal: unitPrice,
                    selections
                }
            ];
        });
    };

    const handleVariantConfirm = (payload) => {
        addToCart(payload);
        setShowVariantModal(false);
        setSelectedProduct(null);
        setSelectedCategory(null);
    };

    const updateCartQuantity = (selectionKey, delta) => {
        setCartItems((current) =>
            current
                .map((item) => {
                    if (item.selectionKey !== selectionKey) return item;
                    const nextQuantity = item.quantity + delta;
                    if (nextQuantity <= 0) return null;
                    return {
                        ...item,
                        quantity: nextQuantity,
                        lineTotal: nextQuantity * item.unitPrice
                    };
                })
                .filter(Boolean)
        );
    };

    const clearCart = () => setCartItems([]);

    if (!hasSession) {
        return <Navigate to="/sessions/select" replace />;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
            <DashboardSidebar />
            <main className="flex-1 p-4 sm:p-8">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Ordering Desk</p>
                            <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>POS</h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">
                                Build the order, apply variant price adjustments, and keep the session isolated.
                            </p>
                        </div>
                        <div className="text-right text-sm text-[#f8efe0]/70">
                            <p className="uppercase tracking-[0.2em] text-[#c9a14a]/80">Current Session</p>
                            <p className="font-semibold text-[#f8efe0]">{currentSession?.name || `Session #${sessionId}`}</p>
                        </div>
                    </div>
                </header>

                <div className="mt-4">
                    <SessionBadge />
                </div>

                {error && <div className="mb-4 rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}

                <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                    <section className="space-y-4">
                        <div className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                                    All Products
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
                        </div>

                        {loading ? (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[#f8efe0]/75">Loading products...</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="rounded-xl border border-[#c9a14a]/20 bg-[#0a1628]/70 p-8 text-center">
                                <p className="text-lg font-medium">No products found.</p>
                                <p className="mt-2 text-sm text-[#f8efe0]/70">Try a different search or category filter.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleProductClick(product)}
                                        className="rounded-2xl border border-white/10 bg-[#0a1628]/80 p-4 text-left shadow-[0_16px_70px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:border-[#c9a14a]/45"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-[#f8efe0]">{product.name}</h3>
                                                <p className="mt-1 text-xs text-[#f8efe0]/60">{product.category_name || categoryLookup[product.category_id]?.name || 'Uncategorized'}</p>
                                            </div>
                                            <span className="rounded-full border border-[#c9a14a]/25 px-3 py-1 text-xs font-semibold text-[#e7c98b]">
                                                {currency.format(Number(product.price || 0))}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm text-[#f8efe0]/70">{product.description || 'No description available.'}</p>
                                        {Array.isArray(categoryLookup[product.category_id]?.variant_groups) && categoryLookup[product.category_id].variant_groups.length > 0 && (
                                            <p className="mt-3 text-xs text-[#f8efe0]/60">
                                                Variants: {categoryLookup[product.category_id].variant_groups.map((group) => group.name).join(', ')}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Cart</h2>
                            <button type="button" onClick={clearCart} className="text-xs font-semibold uppercase tracking-wide text-[#c9a14a]">
                                Clear
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {cartItems.length === 0 ? (
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/70">
                                    Your order cart is empty.
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <article key={item.selectionKey} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-[#f8efe0]">{item.productName}</h3>
                                                <p className="mt-1 text-xs text-[#f8efe0]/60">{item.categoryName}</p>
                                            </div>
                                            <button type="button" onClick={() => updateCartQuantity(item.selectionKey, -item.quantity)} className="text-xs font-semibold uppercase tracking-wide text-red-300">
                                                Remove
                                            </button>
                                        </div>

                                        {item.selections.length > 0 && (
                                            <div className="mt-3 space-y-1 text-xs text-[#f8efe0]/70">
                                                {item.selections.map((selection) => (
                                                    <p key={`${selection.groupId}-${selection.valueId}`}>
                                                        {selection.groupName}: {selection.valueName} (+{currency.format(selection.extraPrice)})
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => updateCartQuantity(item.selectionKey, -1)} className="rounded-md border border-white/15 px-2 py-1 text-sm">-</button>
                                                <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                                <button type="button" onClick={() => updateCartQuantity(item.selectionKey, 1)} className="rounded-md border border-white/15 px-2 py-1 text-sm">+</button>
                                            </div>
                                            <div className="text-right text-sm">
                                                <p className="font-semibold text-[#e7c98b]">{currency.format(item.unitPrice)}</p>
                                                <p className="text-xs text-[#f8efe0]/60">Line: {currency.format(item.lineTotal)}</p>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>

                        <div className="mt-5 rounded-xl border border-[#c9a14a]/25 bg-[#07111f] p-4">
                            <div className="flex items-center justify-between text-sm text-[#f8efe0]/70">
                                <span>Items</span>
                                <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm text-[#f8efe0]/70">
                                <span>Total</span>
                                <span>{currency.format(cartTotal)}</span>
                            </div>
                            <button
                                type="button"
                                className="mt-4 w-full rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-3 text-sm font-semibold text-[#1d1204] disabled:opacity-60"
                                disabled={cartItems.length === 0}
                            >
                                Order Draft Total
                            </button>
                        </div>
                    </aside>
                </div>

                <VariantSelectionModal
                    open={showVariantModal}
                    product={selectedProduct}
                    category={selectedCategory}
                    onClose={() => {
                        setShowVariantModal(false);
                        setSelectedProduct(null);
                        setSelectedCategory(null);
                    }}
                    onConfirm={handleVariantConfirm}
                />
            </main>
        </div>
    );
};

export default PosPage;
