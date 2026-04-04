import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ProductModal from '../categories/ProductModal';

const API_BASE = 'http://localhost:5000/api';

const ProductsTab = ({ canManage, sessionId }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [editingProductId, setEditingProductId] = useState(null);
    const [editingForm, setEditingForm] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const categoryLookup = useMemo(() => {
        return categories.reduce((accumulator, category) => {
            accumulator[category.id] = category.name;
            return accumulator;
        }, {});
    }, [categories]);

    const fetchCategories = async () => {
        const response = await axios.get(`${API_BASE}/categories`, {
            params: { session_id: sessionId, limit: 100 }
        });
        setCategories(response.data.categories || []);
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_BASE}/products`, {
                params: { session_id: sessionId, search }
            });
            setProducts(response.data.products || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to load products.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories().catch((err) => setError(err.response?.data?.error || 'Unable to load categories.'));
    }, [sessionId]);

    useEffect(() => {
        fetchProducts();
    }, [search, sessionId]);

    const handleInlineEditStart = (product) => {
        setEditingProductId(product.id);
        setEditingForm({
            name: product.name || '',
            price: product.price || '',
            description: product.description || '',
            image_url: product.image_url || '',
            category_id: product.category_id || ''
        });
    };

    const handleInlineEditChange = (event) => {
        const { name, value } = event.target;
        setEditingForm((current) => ({ ...current, [name]: value }));
    };

    const handleInlineEditSave = async (productId) => {
        try {
            setSubmitting(true);
            setError('');
            await axios.put(`${API_BASE}/products/${productId}`, {
                ...editingForm,
                session_id: sessionId,
                category_id: Number(editingForm.category_id)
            });
            setEditingProductId(null);
            setEditingForm(null);
            await fetchProducts();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to update product.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateProduct = async (formValues) => {
        try {
            setSubmitting(true);
            setError('');
            await axios.post(`${API_BASE}/products`, {
                ...formValues,
                session_id: sessionId,
                category_id: Number(formValues.category_id)
            });
            setShowCreateModal(false);
            await fetchProducts();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to create product.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Products</p>
                        <h2 className="mt-1 text-3xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Product Catalog</h2>
                        <p className="mt-2 text-sm text-[#f8efe0]/70">Browse every product for the current session. Admin users can edit directly from the table.</p>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#1d1204]"
                        >
                            + Add Product
                        </button>
                    )}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search products..."
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40 focus:border-[#c9a14a]/60 focus:outline-none sm:max-w-md"
                    />
                    <p className="text-sm text-[#f8efe0]/60">Showing {products.length} products</p>
                </div>
            </div>

            {error && <div className="rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}

            {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[#f8efe0]/75">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="rounded-xl border border-[#c9a14a]/20 bg-[#0a1628]/70 p-8 text-center">
                    <p className="text-lg font-medium">No products found for this session.</p>
                    <p className="mt-2 text-sm text-[#f8efe0]/70">Use Add Product to create menu items for the current session.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/80 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-[#c9a14a]/80">
                            <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const isEditing = editingProductId === product.id;
                                return (
                                    <tr key={product.id} className="border-t border-white/10 align-top">
                                        <td className="px-4 py-4">
                                            {isEditing ? (
                                                <input
                                                    name="name"
                                                    value={editingForm?.name || ''}
                                                    onChange={handleInlineEditChange}
                                                    className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm"
                                                />
                                            ) : (
                                                <div>
                                                    <p className="font-semibold text-[#f8efe0]">{product.name}</p>
                                                    <p className="text-xs text-[#f8efe0]/60">{product.description || 'No description'}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {isEditing ? (
                                                <select
                                                    name="category_id"
                                                    value={editingForm?.category_id || ''}
                                                    onChange={handleInlineEditChange}
                                                    className="w-full rounded-md border border-white/15 bg-white px-3 py-2 text-sm text-black"
                                                >
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id} className="bg-white text-black">{category.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-[#f8efe0]/80">{product.category_name || categoryLookup[product.category_id] || 'Uncategorized'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {isEditing ? (
                                                <input
                                                    name="price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={editingForm?.price || ''}
                                                    onChange={handleInlineEditChange}
                                                    className="w-32 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm"
                                                />
                                            ) : (
                                                <span className="font-semibold text-[#e6c48a]">Rs. {Number(product.price).toFixed(2)}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.is_available ? 'bg-emerald-500/15 text-emerald-200' : 'bg-zinc-500/10 text-zinc-300'}`}>
                                                {product.is_available ? 'Available' : 'Unavailable'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {canManage && (
                                                <div className="flex flex-wrap gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={submitting}
                                                                onClick={() => handleInlineEditSave(product.id)}
                                                                className="rounded-md bg-[#c9a14a] px-3 py-2 text-xs font-semibold text-[#201405] disabled:opacity-60"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingProductId(null);
                                                                    setEditingForm(null);
                                                                }}
                                                                className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-[#f8efe0]"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleInlineEditStart(product)}
                                                            className="rounded-md border border-[#c9a14a]/30 px-3 py-2 text-xs font-semibold text-[#f5dfb3]"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ProductModal
                open={showCreateModal}
                initialValues={null}
                submitting={submitting}
                categories={categories}
                fixedCategoryId=""
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateProduct}
            />
        </div>
    );
};

export default ProductsTab;
