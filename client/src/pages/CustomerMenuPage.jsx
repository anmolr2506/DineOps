import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/* ── Hardcoded menu data ──────────────────────────────────────── */
const FULL_MENU = [
    {
        category: 'Starters',
        items: [
            { id: 1, name: 'Crispy Spring Rolls', price: 180, image: '/food/crispy_spring_rolls.png', description: 'Golden fried rolls with veggie filling & chili dip.' },
            { id: 2, name: 'Garlic Naan Bites', price: 120, image: '/food/garlic_naan.png', description: 'Buttery garlic flatbread cut into dippable bites.' },
        ],
    },
    {
        category: 'Main Course',
        items: [
            { id: 3, name: 'Truffle Mushroom Pizza', price: 420, image: '/food/truffle_mushroom_pizza.png', description: 'Wood-fired crust with truffle cream and roasted mushrooms.' },
            { id: 4, name: 'Smoked Paneer Steak', price: 360, image: '/food/smoked_paneer_steak.png', description: 'Char-grilled paneer with herb butter and pepper glaze.' },
            { id: 5, name: 'Butter Chicken', price: 340, image: '/food/butter_chicken.png', description: 'Creamy tomato gravy with tender chicken pieces.' },
            { id: 6, name: 'Dal Makhani', price: 260, image: '/food/dal_makhani.png', description: 'Slow-cooked black lentils in buttery cream.' },
        ],
    },
    {
        category: 'Beverages',
        items: [
            { id: 7, name: 'Cold Brew Tonic', price: 180, image: '/food/cold_brew_tonic.png', description: 'Bold cold brew, tonic sparkle, citrus twist.' },
            { id: 8, name: 'Saffron Lassi', price: 140, image: '/food/saffron_lassi.png', description: 'Creamy yogurt drink infused with saffron.' },
            { id: 9, name: 'Mango Smoothie', price: 160, image: '/food/mango_smoothie.png', description: 'Tropical mango blended with ice cream.' },
        ],
    },
    {
        category: 'Desserts',
        items: [
            { id: 10, name: 'Baked Cheesecake', price: 220, image: '/food/baked_cheesecake.png', description: 'Classic vanilla cheesecake with berry compote.' },
            { id: 11, name: 'Dark Cocoa Mousse', price: 190, image: '/food/dark_cocoa_mousse.png', description: 'Velvety dark chocolate mousse with sea salt.' },
            { id: 12, name: 'Gulab Jamun', price: 130, image: '/food/gulab_jamun.png', description: 'Soft milk dumplings soaked in cardamom syrup.' },
        ],
    },
];

/* ── Deterministic shuffle seeded by token ───────────────────── */
const seededShuffle = (arr, seed) => {
    const result = [...arr];
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    for (let i = result.length - 1; i > 0; i--) {
        h = ((h << 5) - h + i) | 0;
        const j = Math.abs(h) % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

const CustomerMenuPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const table = searchParams.get('table') || '?';
    const token = searchParams.get('token') || '';
    const customerName = decodeURIComponent(searchParams.get('name') || 'Guest');

    const [cart, setCart] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [cartOpen, setCartOpen] = useState(false);
    const [addedItemId, setAddedItemId] = useState(null);
    const cartBarRef = useRef(null);

    /* Shuffled menu — seeded by token so same QR always gives same shuffle */
    const menu = useMemo(() => {
        return FULL_MENU.map((group) => ({
            ...group,
            items: seededShuffle(group.items, token + group.category),
        }));
    }, [token]);

    const categories = useMemo(() => ['All', ...menu.map((g) => g.category)], [menu]);

    const visibleItems = useMemo(() => {
        if (activeCategory === 'All') return menu.flatMap((g) => g.items);
        const group = menu.find((g) => g.category === activeCategory);
        return group ? group.items : [];
    }, [menu, activeCategory]);

    /* Cart helpers */
    const addToCart = useCallback((item) => {
        setCart((prev) => {
            const existing = prev.find((e) => e.id === item.id);
            if (existing) return prev.map((e) => (e.id === item.id ? { ...e, qty: e.qty + 1 } : e));
            return [...prev, { ...item, qty: 1 }];
        });
        setAddedItemId(item.id);
        setTimeout(() => setAddedItemId(null), 600);
    }, []);

    const updateQty = useCallback((id, qty) => {
        if (qty <= 0) {
            setCart((prev) => prev.filter((e) => e.id !== id));
            return;
        }
        setCart((prev) => prev.map((e) => (e.id === id ? { ...e, qty } : e)));
    }, []);

    const removeItem = useCallback((id) => {
        setCart((prev) => prev.filter((e) => e.id !== id));
    }, []);

    const total = useMemo(() => cart.reduce((s, e) => s + e.price * e.qty, 0), [cart]);
    const itemCount = useMemo(() => cart.reduce((s, e) => s + e.qty, 0), [cart]);

    /* Navigate to payment */
    const goToPayment = () => {
        if (cart.length === 0) return;
        const cartData = encodeURIComponent(JSON.stringify(cart));
        navigate(`/customer/payment?table=${table}&token=${token}&name=${encodeURIComponent(customerName)}&cart=${cartData}`);
    };

    /* Auto-close cart panel when empty */
    useEffect(() => {
        if (cart.length === 0) setCartOpen(false);
    }, [cart]);

    return (
        <div className="relative flex min-h-screen flex-col bg-[#0a0a0a] text-white" style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-[#222] bg-[#0a0a0a]/95 px-4 pb-3 pt-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a14a]">Table {table}</p>
                        <h1 className="text-lg font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                            Hi, {customerName} 👋
                        </h1>
                    </div>
                    <div className="rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-[10px] text-[#888]">
                        DineOps
                    </div>
                </div>

                {/* Category tabs */}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                                activeCategory === cat
                                    ? 'bg-gradient-to-r from-[#c9a14a] to-[#e1bf7f] text-[#1a0e00]'
                                    : 'border border-[#333] bg-[#1a1a1a] text-[#aaa]'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {/* Items grid */}
            <main className="flex-1 px-4 py-4" style={{ paddingBottom: cart.length > 0 ? 90 : 16 }}>
                <div className="grid grid-cols-2 gap-3">
                    {visibleItems.map((item) => (
                        <div
                            key={item.id}
                            className={`group relative overflow-hidden rounded-xl border border-[#222] bg-[#141414] transition-transform ${
                                addedItemId === item.id ? 'scale-95' : ''
                            }`}
                        >
                            <div className="relative h-28 w-full overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                            </div>
                            <div className="p-3">
                                <h3 className="text-xs font-semibold leading-tight">{item.name}</h3>
                                <p className="mt-0.5 text-[10px] leading-snug text-[#777]">{item.description}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#c9a14a]">₹{item.price}</span>
                                    <button
                                        type="button"
                                        onClick={() => addToCart(item)}
                                        className="rounded-lg bg-gradient-to-r from-[#c9a14a] to-[#e1bf7f] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#1a0e00] transition active:scale-90"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Added flash overlay */}
                            {addedItemId === item.id && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#c9a14a]/20">
                                    <span className="text-2xl">✓</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>

            {/* Floating cart bar */}
            {cart.length > 0 && (
                <div
                    ref={cartBarRef}
                    className="fixed bottom-0 left-1/2 z-30 w-full -translate-x-1/2 animate-slideUp"
                    style={{ maxWidth: 480 }}
                >
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="flex w-full items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#c9a14a] to-[#e1bf7f] px-5 py-4 text-[#1a0e00] shadow-[0_-4px_30px_rgba(201,161,74,0.3)]"
                    >
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a0e00]/20 text-xs font-bold">
                                {itemCount}
                            </span>
                            <span className="text-sm font-bold">View Cart</span>
                        </div>
                        <span className="text-sm font-bold">₹{total.toFixed(0)}</span>
                    </button>
                </div>
            )}

            {/* Cart slide-up panel */}
            {cartOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/70"
                        onClick={() => setCartOpen(false)}
                    />

                    {/* Panel */}
                    <div
                        className="fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 animate-slideUp rounded-t-3xl border-t border-[#333] bg-[#111] px-5 pb-6 pt-4"
                        style={{ maxWidth: 480, maxHeight: '75vh', overflowY: 'auto' }}
                    >
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#444]" />
                        <h2 className="text-lg font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                            Your Cart
                        </h2>

                        <div className="mt-4 space-y-3">
                            {cart.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#1a1a1a] p-3">
                                    <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold">{item.name}</p>
                                        <p className="text-[10px] text-[#c9a14a]">₹{item.price} × {item.qty}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.id, item.qty - 1)}
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#444] text-xs"
                                        >
                                            −
                                        </button>
                                        <span className="w-5 text-center text-xs">{item.qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.id, item.qty + 1)}
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#444] text-xs"
                                        >
                                            +
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="ml-1 text-xs text-red-400 hover:text-red-300"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 border-t border-[#333] pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#aaa]">Total</span>
                                <span className="font-bold text-[#c9a14a]">₹{total.toFixed(0)}</span>
                            </div>
                            <button
                                type="button"
                                onClick={goToPayment}
                                className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#c9a14a] to-[#e1bf7f] py-4 text-sm font-bold uppercase tracking-widest text-[#1a0e00] transition active:scale-[0.97]"
                            >
                                Proceed to Payment
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Inline CSS for animations */}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(100%); }
                    to { transform: translateX(-50%) translateY(0); }
                }
                .animate-slideUp {
                    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default CustomerMenuPage;
