import { useEffect, useState } from 'react';

const emptyProduct = {
    name: '',
    price: '',
    description: '',
    image_url: '',
    category_id: ''
};

const ProductModal = ({ open, onClose, onSubmit, initialValues, categoryName, submitting, categories = [], fixedCategoryId = '' }) => {
    const [form, setForm] = useState(emptyProduct);

    useEffect(() => {
        if (initialValues) {
            setForm({
                name: initialValues.name || '',
                price: initialValues.price || '',
                description: initialValues.description || '',
                image_url: initialValues.image_url || '',
                category_id: initialValues.category_id || fixedCategoryId || ''
            });
            return;
        }

        setForm({ ...emptyProduct, category_id: fixedCategoryId || '' });
    }, [fixedCategoryId, initialValues, open]);

    if (!open) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({ ...form, category_id: form.category_id || fixedCategoryId || '' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-[#c9a14a]/30 bg-[#0a1628] p-6 text-[#f8efe0] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <h2 className="text-2xl font-semibold">{initialValues ? 'Edit Product' : `Add Product to ${categoryName}`}</h2>

                <div className="mt-5 space-y-4">
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Product name"
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm focus:border-[#c9a14a]/70 focus:outline-none"
                        required
                    />
                    <input
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm focus:border-[#c9a14a]/70 focus:outline-none"
                        required
                    />
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Description"
                        rows={3}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm focus:border-[#c9a14a]/70 focus:outline-none"
                    />
                    <input
                        name="image_url"
                        value={form.image_url}
                        onChange={handleChange}
                        placeholder="Image URL"
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm focus:border-[#c9a14a]/70 focus:outline-none"
                    />
                    <select
                        name="category_id"
                        value={form.category_id}
                        onChange={handleChange}
                        disabled={Boolean(fixedCategoryId)}
                        className="w-full rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black focus:border-[#c9a14a]/70 focus:outline-none disabled:opacity-60"
                        required
                    >
                        <option value="" className="bg-white text-black">Select category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id} className="bg-white text-black">
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-4 py-2 text-sm">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-2 text-sm font-semibold text-[#201405] disabled:opacity-60"
                    >
                        {submitting ? 'Saving...' : initialValues ? 'Save Product' : 'Create Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductModal;
