import { useEffect, useState } from 'react';

const initialState = {
    name: '',
    description: '',
    image_url: '',
    status: 'active',
    variant_group_ids: []
};

const CategoryModal = ({ open, onClose, onSubmit, initialValues, submitting, availableVariantGroups = [] }) => {
    const [form, setForm] = useState(initialState);
    const [selectedVariantGroupIds, setSelectedVariantGroupIds] = useState([]);

    useEffect(() => {
        if (initialValues) {
            setForm({
                name: initialValues.name || '',
                description: initialValues.description || '',
                image_url: initialValues.image_url || '',
                status: initialValues.status || 'active',
                variant_group_ids: initialValues.variant_group_ids || []
            });
            setSelectedVariantGroupIds(initialValues.variant_group_ids || []);
            return;
        }
        setForm(initialState);
        setSelectedVariantGroupIds([]);
    }, [initialValues, open]);

    if (!open) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({ ...form, variant_group_ids: selectedVariantGroupIds });
    };

    const toggleVariantGroup = (groupId) => {
        setSelectedVariantGroupIds((current) =>
            current.includes(groupId)
                ? current.filter((id) => id !== groupId)
                : [...current, groupId]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-[#c9a14a]/30 bg-[#0a1628] p-6 text-[#f8efe0] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <h2 className="text-2xl font-semibold">{initialValues ? 'Edit Category' : 'Add Category'}</h2>

                <div className="mt-5 space-y-4">
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Category name"
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
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black focus:border-[#c9a14a]/70 focus:outline-none"
                    >
                        <option value="active" className="bg-white text-black">Active</option>
                        <option value="inactive" className="bg-white text-black">Inactive</option>
                    </select>

                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a14a]/80">Variant Groups</p>
                        {availableVariantGroups.length === 0 ? (
                            <p className="text-sm text-[#f8efe0]/70">No variant groups available yet.</p>
                        ) : (
                            <div className="max-h-40 space-y-2 overflow-auto pr-1">
                                {availableVariantGroups.map((group) => (
                                    <label key={group.id} className="flex items-start gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#f8efe0]/80">
                                        <input
                                            type="checkbox"
                                            checked={selectedVariantGroupIds.includes(group.id)}
                                            onChange={() => toggleVariantGroup(group.id)}
                                            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[#c9a14a] focus:ring-[#c9a14a]/50"
                                        />
                                        <span>
                                            <span className="block font-medium text-[#f8efe0]">{group.name}</span>
                                            <span className="block text-xs text-[#f8efe0]/60">{group.description || 'No description'}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
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
                        {submitting ? 'Saving...' : initialValues ? 'Save Changes' : 'Create Category'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoryModal;
