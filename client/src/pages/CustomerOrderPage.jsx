import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const menuData = [
    {
        category: 'Chef Specials',
        items: [
            { id: 1, name: 'Truffle Mushroom Pizza', price: 420, description: 'Wood-fired crust with truffle cream and roasted mushrooms.' },
            { id: 2, name: 'Smoked Paneer Steak', price: 360, description: 'Char-grilled paneer with herb butter and pepper glaze.' }
        ]
    },
    {
        category: 'Beverages',
        items: [
            { id: 3, name: 'Cold Brew Tonic', price: 180, description: 'Bold cold brew, tonic sparkle, citrus twist.' },
            { id: 4, name: 'Saffron Lassi', price: 140, description: 'Creamy yogurt drink infused with saffron and cardamom.' }
        ]
    },
    {
        category: 'Desserts',
        items: [
            { id: 5, name: 'Baked Cheesecake', price: 220, description: 'Classic vanilla cheesecake with berry compote.' },
            { id: 6, name: 'Dark Cocoa Mousse', price: 190, description: 'Velvety dark chocolate mousse with sea salt flakes.' }
        ]
    }
];

const CustomerOrderPage = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [message, setMessage] = useState('');

    const addToCart = (item) => {
        setCart((current) => {
            const existing = current.find((entry) => entry.id === item.id);
            if (existing) {
                return current.map((entry) => (entry.id === item.id ? { ...entry, qty: entry.qty + 1 } : entry));
            }
            return [...current, { ...item, qty: 1 }];
        });
    };

    const updateQty = (itemId, nextQty) => {
        if (nextQty <= 0) {
            setCart((current) => current.filter((entry) => entry.id !== itemId));
            return;
        }
        setCart((current) => current.map((entry) => (entry.id === itemId ? { ...entry, qty: nextQty } : entry)));
    };

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
        [cart]
    );

    const placeOrder = () => {
        if (cart.length === 0) {
            setMessage('Add at least one item to place an order.');
            return;
        }
        setMessage('Order placed successfully. Our team will confirm shortly.');
        setCart([]);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#040a16] via-[#0b1a30] to-[#132745] px-4 py-8 text-[#f8efe0] sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="rounded-2xl border border-[#c9a14a]/25 bg-[#0a1628]/85 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.4)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-[#c9a14a]/85">Customer Ordering</p>
                            <h1 className="mt-2 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Order Food</h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">Public order flow. No login required.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-2 text-sm font-semibold text-[#f5dfb3]"
                        >
                            Back Home
                        </button>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <section className="rounded-2xl border border-white/10 bg-[#0a1628]/80 p-5">
                        {menuData.map((group) => (
                            <div key={group.category} className="mb-6 last:mb-0">
                                <h2 className="text-xl font-semibold text-[#f2d9a8]" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{group.category}</h2>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {group.items.map((item) => (
                                        <article key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                            <h3 className="text-lg font-semibold">{item.name}</h3>
                                            <p className="mt-1 text-sm text-[#f8efe0]/70">{item.description}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <p className="text-sm font-semibold text-[#f2d9a8]">Rs. {item.price.toFixed(2)}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(item)}
                                                    className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#1f1201]"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>

                    <aside className="rounded-2xl border border-[#c9a14a]/25 bg-[#0a1628]/85 p-5">
                        <h2 className="text-2xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Your Cart</h2>
                        {cart.length === 0 ? (
                            <p className="mt-3 text-sm text-[#f8efe0]/70">Cart is empty.</p>
                        ) : (
                            <div className="mt-3 space-y-3">
                                {cart.map((item) => (
                                    <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <p className="font-medium">{item.name}</p>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} className="rounded border border-white/20 px-2">-</button>
                                                <span className="text-sm">{item.qty}</span>
                                                <button type="button" onClick={() => updateQty(item.id, item.qty + 1)} className="rounded border border-white/20 px-2">+</button>
                                            </div>
                                            <p className="text-sm text-[#f2d9a8]">Rs. {(item.price * item.qty).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-5 border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>Subtotal</span>
                                <span className="font-semibold text-[#f2d9a8]">Rs. {subtotal.toFixed(2)}</span>
                            </div>
                            <button
                                type="button"
                                onClick={placeOrder}
                                className="mt-4 w-full rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#1f1201]"
                            >
                                Place Order
                            </button>
                            {message && (
                                <p className="mt-3 rounded-lg border border-[#c9a14a]/30 bg-[#c9a14a]/12 p-3 text-xs text-[#f7e3ba]">
                                    {message}
                                </p>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CustomerOrderPage;
