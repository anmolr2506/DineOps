import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import CartBar from '../../components/customer/CartBar';
import CartPanel from '../../components/customer/CartPanel';
import { fetchCustomerContext } from '../../services/customerOrdering.service';
import CustomerViewportGuard from '../../components/customer/CustomerViewportGuard';

const STORAGE_CTX = 'dineops_customer_ctx';
const STORAGE_CART = 'dineops_customer_cart';

const hashString = (value) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash);
};

const CustomerMenu = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [context, setContext] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    const sessionId = searchParams.get('session_id') || '';
    const tableId = searchParams.get('table_id') || '';
    const token = searchParams.get('token') || '';

    const queryString = useMemo(() => {
        const params = new URLSearchParams({
            session_id: String(sessionId),
            table_id: String(tableId),
            token: String(token)
        });
        return params.toString();
    }, [sessionId, tableId, token]);

    useEffect(() => {
        const existing = sessionStorage.getItem(STORAGE_CART);
        if (existing) {
            try {
                const parsed = JSON.parse(existing);
                if (Array.isArray(parsed)) {
                    setCart(parsed);
                }
            } catch (_error) {
                sessionStorage.removeItem(STORAGE_CART);
            }
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_CART, JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await fetchCustomerContext({ sessionId, tableId, token });
                setContext(data);
            } catch (requestError) {
                setError(requestError.response?.data?.error || 'Unable to load menu for this QR.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [sessionId, tableId, token]);

    const shuffledProducts = useMemo(() => {
        const products = Array.isArray(context?.products) ? [...context.products] : [];
        const seed = `${sessionId}:${token}`;

        return products.sort((left, right) => {
            const leftScore = hashString(`${seed}:${left.id}`);
            const rightScore = hashString(`${seed}:${right.id}`);
            if (leftScore === rightScore) {
                return Number(left.id) - Number(right.id);
            }
            return leftScore - rightScore;
        });
    }, [context?.products, sessionId, token]);

    const filteredProducts = useMemo(() => {
        if (selectedCategoryId === 'all') {
            return shuffledProducts;
        }

        return shuffledProducts.filter((product) => Number(product.category_id) === Number(selectedCategoryId));
    }, [selectedCategoryId, shuffledProducts]);

    const cartMeta = useMemo(() => {
        const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const total = cart.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
        return { itemCount, total };
    }, [cart]);

    const addToCart = (product) => {
        const base = Number(product.price || 0);
        const taxPercent = Number(product.tax_percent || 0);
        const price = Number((base + (base * taxPercent / 100)).toFixed(2));

        setCart((current) => {
            const existingIndex = current.findIndex((entry) => Number(entry.product_id) === Number(product.id));
            if (existingIndex === -1) {
                return [
                    ...current,
                    {
                        product_id: Number(product.id),
                        name: product.name,
                        price,
                        quantity: 1
                    }
                ];
            }

            const next = [...current];
            next[existingIndex] = {
                ...next[existingIndex],
                quantity: Number(next[existingIndex].quantity || 0) + 1
            };
            return next;
        });
    };

    const incrementQty = (productId) => {
        setCart((current) => current.map((item) => (
            Number(item.product_id) === Number(productId)
                ? { ...item, quantity: Number(item.quantity || 0) + 1 }
                : item
        )));
    };

    const decrementQty = (productId) => {
        setCart((current) => current
            .map((item) => {
                if (Number(item.product_id) !== Number(productId)) {
                    return item;
                }
                const nextQty = Number(item.quantity || 0) - 1;
                return nextQty <= 0 ? null : { ...item, quantity: nextQty };
            })
            .filter(Boolean));
    };

    const removeItem = (productId) => {
        setCart((current) => current.filter((item) => Number(item.product_id) !== Number(productId)));
    };

    const proceedToPayment = () => {
        const existingCtx = sessionStorage.getItem(STORAGE_CTX);
        const parsed = existingCtx ? JSON.parse(existingCtx) : {};
        if (!parsed.customer_name) {
            navigate(`/customer?${queryString}`);
            return;
        }

        navigate(`/customer/payment?${queryString}`);
    };

    return (
        <CustomerViewportGuard>
        <div className="min-h-screen px-4 py-4 pb-24 text-[#f8efe0]">
            <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4">
                <header className="rounded-[1.6rem] border border-[#C9A14A]/18 bg-[rgba(9,15,28,0.86)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                    <p className="font-body text-[0.68rem] uppercase tracking-[0.32em] text-[#C9A14A]">Table #{context?.table?.table_number || '-'}</p>
                    <h1 className="font-display mt-2 text-[2.1rem] leading-[0.95] font-semibold text-[#f7eed9]">Menu</h1>
                    <p className="mt-3 text-xs text-[#f8efe0]/70">Menu order is uniquely shuffled for this QR token.</p>
                </header>

                {loading && <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/75">Loading menu...</div>}
                {error && <div className="rounded-[1.1rem] border border-red-400/35 bg-red-900/20 p-4 text-sm text-red-100">{error}</div>}

                {!loading && !error && (
                    <>
                        <div className="flex gap-2 overflow-auto pb-1">
                            <button
                                type="button"
                                onClick={() => setSelectedCategoryId('all')}
                                className={`rounded-full border px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] ${selectedCategoryId === 'all' ? 'border-[#C9A14A] bg-[#C9A14A]/18 text-[#f2d9a8]' : 'border-white/12 text-[#f8efe0]/70'}`}
                            >
                                All
                            </button>
                            {(context?.categories || []).map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setSelectedCategoryId(category.id)}
                                    className={`rounded-full border px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] whitespace-nowrap ${Number(selectedCategoryId) === Number(category.id) ? 'border-[#C9A14A] bg-[#C9A14A]/18 text-[#f2d9a8]' : 'border-white/12 text-[#f8efe0]/70'}`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        <section className="grid grid-cols-2 gap-3">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} onAdd={addToCart} />
                            ))}
                        </section>
                    </>
                )}
            </div>

            <CartBar
                visible={cartMeta.itemCount > 0}
                itemCount={cartMeta.itemCount}
                total={cartMeta.total}
                onOpen={() => setCartOpen(true)}
            />

            <CartPanel
                open={cartOpen}
                items={cart}
                onClose={() => setCartOpen(false)}
                onIncrement={incrementQty}
                onDecrement={decrementQty}
                onRemove={removeItem}
                total={cartMeta.total}
                onProceed={proceedToPayment}
            />
        </div>
        </CustomerViewportGuard>
    );
};

export default CustomerMenu;
