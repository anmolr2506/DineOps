import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import SessionBadge from '../components/SessionBadge';
import FloorSelector from '../components/pos/FloorSelector';
import TableSelector from '../components/pos/TableSelector';
import MenuView from '../components/pos/MenuView';
import CartSidebar from '../components/pos/CartSidebar';
import VariantSelectionModal from '../components/pos/VariantSelectionModal';

const API_BASE = 'http://localhost:5000/api';
const PENDING_PAYMENT_KEY = 'pending_payment_order';

const POSTerminal = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const sessionId = Number(localStorage.getItem('session_id'));
    const hasSession = Number.isInteger(sessionId) && sessionId > 0;

    const [floors, setFloors] = useState([]);
    const [tables, setTables] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedFloorId, setSelectedFloorId] = useState(null);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [customer, setCustomer] = useState({ name: '', phone: '', customer_id: null, isExisting: false });
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState(location.state?.message || '');

    const selectedTable = useMemo(() => tables.find((table) => Number(table.id) === Number(selectedTableId)) || null, [tables, selectedTableId]);

    const categoryLookup = useMemo(() => {
        return categories.reduce((accumulator, category) => {
            accumulator[category.id] = category;
            return accumulator;
        }, {});
    }, [categories]);

    const total = useMemo(() => cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0), [cartItems]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError('');
            const [floorsResponse, categoriesResponse, productsResponse] = await Promise.all([
                axios.get(`${API_BASE}/floors`),
                axios.get(`${API_BASE}/categories`, { params: { limit: 100 } }),
                axios.get(`${API_BASE}/products`)
            ]);

            const nextFloors = floorsResponse.data.floors || [];
            setFloors(nextFloors);
            setCategories(categoriesResponse.data.categories || []);
            setProducts((productsResponse.data.products || []).filter((product) => product.is_available !== false));

            if (nextFloors.length > 0) {
                const defaultFloorId = nextFloors[0].id;
                setSelectedFloorId(defaultFloorId);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load POS data.');
        } finally {
            setLoading(false);
        }
    };

    const loadTables = async (floorId) => {
        if (!floorId) {
            setTables([]);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE}/tables`, {
                params: { floor_id: floorId }
            });
            setTables(response.data.tables || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load floor tables.');
        }
    };

    useEffect(() => {
        if (!hasSession) return;
        loadInitialData();
    }, [hasSession]);

    useEffect(() => {
        if (!selectedFloorId) return;
        loadTables(selectedFloorId);
    }, [selectedFloorId]);

    useEffect(() => {
        const phone = customer.phone;
        if (!/^\d{10}$/.test(phone)) {
            setCustomer((current) => ({ ...current, customer_id: null, isExisting: false }));
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const response = await axios.get(`${API_BASE}/customers`, { params: { phone } });
                const found = response.data.customer;
                if (found) {
                    setCustomer((current) => ({
                        ...current,
                        name: found.name,
                        customer_id: found.id,
                        isExisting: true
                    }));
                } else {
                    setCustomer((current) => ({
                        ...current,
                        customer_id: null,
                        isExisting: false
                    }));
                }
            } catch {
                setCustomer((current) => ({ ...current, customer_id: null, isExisting: false }));
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [customer.phone]);

    const pushCartItem = ({ product, selections = [], finalUnitPrice }) => {
        const sortedValueIds = selections.map((selection) => Number(selection.valueId)).sort((a, b) => a - b);
        const lineKey = `${product.id}:${sortedValueIds.join('-') || 'base'}`;
        const labelList = selections.map((selection) => `${selection.groupName}: ${selection.valueName}`);

        setCartItems((current) => {
            const index = current.findIndex((item) => String(item.line_key) === String(lineKey));
            if (index === -1) {
                return [
                    ...current,
                    {
                        line_key: lineKey,
                        product_id: product.id,
                        name: product.name,
                        quantity: 1,
                        price: Number(finalUnitPrice.toFixed(2)),
                        selected_values: sortedValueIds,
                        variant_labels: labelList
                    }
                ];
            }
            const next = [...current];
            next[index] = {
                ...next[index],
                quantity: next[index].quantity + 1
            };
            return next;
        });
    };

    const handleAddToCart = (product) => {
        const category = categoryLookup[product.category_id];
        const variantGroups = Array.isArray(category?.variant_groups) ? category.variant_groups : [];
        const hasVariants = variantGroups.length > 0;

        if (!hasVariants) {
            const base = Number(product.price || 0);
            const taxPercent = Number(product.tax_percent || 0);
            const unitPrice = base + (base * taxPercent / 100);
            pushCartItem({ product, selections: [], finalUnitPrice: unitPrice });
            return;
        }

        setSelectedProduct(product);
        setSelectedCategory(category);
        setShowVariantModal(true);
    };

    const handleVariantConfirm = ({ product, selections, finalUnitPrice }) => {
        pushCartItem({ product, selections, finalUnitPrice });
        setShowVariantModal(false);
        setSelectedProduct(null);
        setSelectedCategory(null);
    };

    const handleChangeQty = (lineKey, delta) => {
        setCartItems((current) => current
            .map((item) => {
                if (String(item.line_key) !== String(lineKey)) return item;
                const nextQty = item.quantity + delta;
                if (nextQty <= 0) return null;
                return { ...item, quantity: nextQty };
            })
            .filter(Boolean));
    };

    const handleChangeCustomer = (key, value) => {
        setCustomer((current) => ({
            ...current,
            [key]: value,
            ...(key === 'phone' ? { customer_id: null, isExisting: false } : {})
        }));
    };

    const handleFinalizeOrder = async () => {
        if (!selectedTableId) {
            setError('Please select a table before finalizing.');
            return;
        }
        if (cartItems.length === 0) {
            setError('Please add items to cart.');
            return;
        }
        if (!customer.name.trim()) {
            setError('Customer name is required.');
            return;
        }
        if (!/^\d{10}$/.test(customer.phone)) {
            setError('Customer phone must be 10 digits.');
            return;
        }

        try {
            setFinalizing(true);
            setError('');

            const response = await axios.post(`${API_BASE}/orders`, {
                session_id: sessionId,
                table_id: selectedTableId,
                customer_id: customer.customer_id,
                customer_name: customer.name,
                phone: customer.phone,
                items: cartItems.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    selected_values: item.selected_values || []
                }))
            });

            const order = response.data.order;
            const paymentContext = {
                order_id: order.id,
                total_amount: Number(order.total_amount || 0),
                table_id: Number(order.table_id),
                session_id: Number(order.session_id),
                items: order.items || cartItems,
                customer_name: customer.name,
                phone: customer.phone
            };

            sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(paymentContext));
            navigate('/terminal/payment', { state: { order: paymentContext } });
            window.location.assign('/terminal/payment');
        } catch (err) {
            const apiError = String(err.response?.data?.error || '');
            const isActiveOrderConflict = err.response?.status === 409 && /active order already exists/i.test(apiError);

            if (isActiveOrderConflict) {
                try {
                    const existingOrdersResponse = await axios.get(`${API_BASE}/orders`, {
                        params: { session_id: sessionId, table_id: selectedTableId }
                    });

                    const existingOrder = (existingOrdersResponse.data.orders || []).find((order) => {
                        const status = String(order.status || '').toLowerCase();
                        return ['pending', 'approved', 'preparing'].includes(status);
                    });

                    if (existingOrder) {
                        const paymentContext = {
                            order_id: Number(existingOrder.id),
                            total_amount: Number(existingOrder.total_amount || 0),
                            table_id: Number(existingOrder.table_id),
                            session_id: Number(existingOrder.session_id),
                            items: existingOrder.items || [],
                            customer_name: customer.name,
                            phone: customer.phone
                        };

                        sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(paymentContext));
                        navigate('/terminal/payment', {
                            state: {
                                order: paymentContext,
                                message: `Using existing unpaid order #${existingOrder.id} for this table.`
                            }
                        });
                        window.location.assign('/terminal/payment');
                        return;
                    }
                } catch {
                    // Fall through to the standard error if lookup fails.
                }
            }

            setError(apiError || 'Failed to finalize order.');
        } finally {
            setFinalizing(false);
        }
    };

    if (!hasSession) {
        return <Navigate to="/sessions" replace />;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
            <DashboardSidebar />
            <main className="relative z-10 flex-1 p-4 sm:p-8">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">DineOps POS Terminal</p>
                    <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Manual Order Flow</h1>
                    <p className="mt-2 text-sm text-[#f8efe0]/70">Floor → Table → Menu → Cart → Payment → Kitchen realtime.</p>
                </header>

                <div className="mt-4">
                    <SessionBadge />
                </div>

                {notice && (
                    <div className="mt-4 rounded-lg border border-emerald-400/45 bg-emerald-900/25 p-3 text-sm text-emerald-100">
                        {notice}
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[#f8efe0]/75">Loading terminal...</div>
                ) : (
                    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
                        <section className="space-y-4">
                            <FloorSelector
                                floors={floors}
                                selectedFloorId={selectedFloorId}
                                onSelectFloor={(floorId) => {
                                    setSelectedFloorId(floorId);
                                    setSelectedTableId(null);
                                }}
                            />

                            <TableSelector
                                tables={tables}
                                selectedTableId={selectedTableId}
                                onSelectTable={setSelectedTableId}
                            />

                            <MenuView
                                categories={categories}
                                products={products}
                                onAdd={handleAddToCart}
                            />
                        </section>

                        <CartSidebar
                            cartItems={cartItems}
                            onChangeQty={handleChangeQty}
                            onClearCart={() => setCartItems([])}
                            customer={customer}
                            onChangeCustomer={handleChangeCustomer}
                            total={total}
                            selectedTable={selectedTable}
                            onFinalize={handleFinalizeOrder}
                            finalizing={finalizing}
                        />
                    </div>
                )}

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

export default POSTerminal;
