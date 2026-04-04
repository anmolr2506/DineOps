import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import CategoryCard from '../categories/CategoryCard';
import CategoryModal from '../categories/CategoryModal';
import ProductModal from '../categories/ProductModal';

const API_BASE = 'http://localhost:5000/api';
const DEFAULT_LIMIT = 6;

const CategoriesTab = ({ canManage, sessionId }) => {
    const [categories, setCategories] = useState([]);
    const [variantGroups, setVariantGroups] = useState([]);
    const [productsByCategory, setProductsByCategory] = useState({});
    const [loadingProductsByCategory, setLoadingProductsByCategory] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_LIMIT, total: 0 });
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [productCategory, setProductCategory] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const totalPages = useMemo(() => Math.max(1, Math.ceil((pagination.total || 0) / pagination.limit)), [pagination]);

    const fetchVariantGroups = async () => {
        const response = await axios.get(`${API_BASE}/variants/groups`, {
            params: { session_id: sessionId, limit: 100 }
        });
        setVariantGroups(response.data.groups || []);
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_BASE}/categories`, {
                params: { session_id: sessionId, search, page, limit: DEFAULT_LIMIT }
            });
            setCategories(response.data.categories || []);
            setPagination(response.data.pagination || { page, limit: DEFAULT_LIMIT, total: 0 });
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to fetch categories.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVariantGroups().catch((err) => {
            setError(err.response?.data?.error || 'Unable to load variant groups.');
        });
    }, [sessionId]);

    useEffect(() => {
        fetchCategories();
    }, [page, search, sessionId]);

    const loadProducts = async (categoryId, forceReload = false) => {
        if (!forceReload && productsByCategory[categoryId]) return;

        try {
            setLoadingProductsByCategory((prev) => ({ ...prev, [categoryId]: true }));
            const response = await axios.get(`${API_BASE}/products`, {
                params: { session_id: sessionId, category_id: categoryId }
            });
            setProductsByCategory((prev) => ({ ...prev, [categoryId]: response.data.products || [] }));
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to fetch products.');
        } finally {
            setLoadingProductsByCategory((prev) => ({ ...prev, [categoryId]: false }));
        }
    };

    const handleCategorySubmit = async (formValues) => {
        try {
            setSubmitting(true);
            setError('');
            if (editingCategory) {
                await axios.put(`${API_BASE}/categories/${editingCategory.id}`, { ...formValues, session_id: sessionId });
            } else {
                await axios.post(`${API_BASE}/categories`, { ...formValues, session_id: sessionId });
            }
            setShowCategoryModal(false);
            setEditingCategory(null);
            await fetchCategories();
            await fetchVariantGroups();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to save category.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!canManage) return;
        try {
            setError('');
            await axios.delete(`${API_BASE}/categories/${categoryId}`, { data: { session_id: sessionId } });
            setProductsByCategory((prev) => {
                const nextState = { ...prev };
                delete nextState[categoryId];
                return nextState;
            });
            await fetchCategories();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to delete category.');
        }
    };

    const handleProductSubmit = async (formValues) => {
        if (!productCategory) return;

        try {
            setSubmitting(true);
            setError('');
            const payload = {
                ...formValues,
                category_id: Number(formValues.category_id || productCategory.id),
                session_id: sessionId
            };

            if (editingProduct) {
                await axios.put(`${API_BASE}/products/${editingProduct.id}`, payload);
            } else {
                await axios.post(`${API_BASE}/products`, payload);
            }

            setShowProductModal(false);
            setEditingProduct(null);
            await loadProducts(payload.category_id, true);
            await fetchCategories();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to save product.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Categories</p>
                        <h2 className="mt-1 text-3xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Category Management</h2>
                        <p className="mt-2 text-sm text-[#f8efe0]/70">Browse categories for the current session and manage which variant groups apply to each one.</p>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingCategory(null);
                                setShowCategoryModal(true);
                            }}
                            className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#1d1204]"
                        >
                            + Add Category
                        </button>
                    )}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        value={search}
                        onChange={(event) => {
                            setPage(1);
                            setSearch(event.target.value);
                        }}
                        placeholder="Search categories..."
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40 focus:border-[#c9a14a]/60 focus:outline-none sm:max-w-md"
                    />
                    <p className="text-sm text-[#f8efe0]/60">
                        Showing {categories.length} of {pagination.total} categories
                    </p>
                </div>
            </div>

            {error && <div className="rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}

            {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[#f8efe0]/75">Loading categories...</div>
            ) : categories.length === 0 ? (
                <div className="rounded-xl border border-[#c9a14a]/20 bg-[#0a1628]/70 p-8 text-center">
                    <p className="text-lg font-medium">No categories found for this session.</p>
                    <p className="mt-2 text-sm text-[#f8efe0]/70">{canManage ? 'Create your first category to start adding products.' : 'Please contact an admin to set up categories.'}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {categories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            products={productsByCategory[category.id] || []}
                            loadingProducts={Boolean(loadingProductsByCategory[category.id])}
                            canManage={canManage}
                            onLoadProducts={loadProducts}
                            onAddProduct={(selectedCategory) => {
                                setProductCategory(selectedCategory);
                                setEditingProduct(null);
                                setShowProductModal(true);
                            }}
                            onEditProduct={(selectedCategory, product) => {
                                setProductCategory(selectedCategory);
                                setEditingProduct(product);
                                setShowProductModal(true);
                            }}
                            onEditCategory={(selectedCategory) => {
                                setEditingCategory({
                                    ...selectedCategory,
                                    variant_group_ids: Array.isArray(selectedCategory.variant_groups)
                                        ? selectedCategory.variant_groups.map((group) => group.id)
                                        : []
                                });
                                setShowCategoryModal(true);
                            }}
                            onDeleteCategory={handleDeleteCategory}
                        />
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f8efe0]/80">
                <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-white/15 px-3 py-2 disabled:opacity-40"
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-white/15 px-3 py-2 disabled:opacity-40"
                >
                    Next
                </button>
            </div>

            <CategoryModal
                open={showCategoryModal}
                initialValues={editingCategory}
                submitting={submitting}
                availableVariantGroups={variantGroups}
                onClose={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                }}
                onSubmit={handleCategorySubmit}
            />

            <ProductModal
                open={showProductModal}
                initialValues={editingProduct}
                categoryName={productCategory?.name || ''}
                submitting={submitting}
                categories={categories}
                fixedCategoryId={productCategory?.id || ''}
                onClose={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setProductCategory(null);
                }}
                onSubmit={handleProductSubmit}
            />
        </div>
    );
};

export default CategoriesTab;
