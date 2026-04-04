import { useEffect, useState } from 'react';

const emptyValueRow = () => ({ name: '', extra_price: 0, value_type: 'unit' });

const emptyState = {
    name: '',
    description: '',
    status: 'active',
    values: [emptyValueRow()]
};

const normalizeValues = (values) => {
    if (!Array.isArray(values) || values.length === 0) {
        return [emptyValueRow()];
    }

    return values.map((value) => ({
        name: value.name || '',
        extra_price: value.extra_price ?? 0,
        value_type: value.value_type || 'unit'
    }));
};

const VariantGroupModal = ({ open, onClose, onSubmit, initialValues, submitting }) => {
    const [form, setForm] = useState(emptyState);

    useEffect(() => {
        if (initialValues) {
            setForm({
                name: initialValues.name || '',
                description: initialValues.description || '',
                status: initialValues.status || 'active',
                values: normalizeValues(initialValues.values)
            });
            return;
        }

        setForm(emptyState);
    }, [initialValues, open]);

    if (!open) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleValueChange = (index, field, value) => {
        setForm((current) => ({
            ...current,
            values: current.values.map((row, rowIndex) => {
                if (rowIndex !== index) return row;
                return {
                    ...row,
                    [field]: value
                };
            })
        }));
    };

    const addValueRow = () => {
        setForm((current) => ({ ...current, values: [...current.values, emptyValueRow()] }));
    };

    const removeValueRow = (index) => {
        setForm((current) => ({
            ...current,
            values: current.values.length > 1 ? current.values.filter((_, rowIndex) => rowIndex !== index) : current.values
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const values = form.values
            .map((value) => ({
                name: typeof value.name === 'string' ? value.name.trim() : '',
                extra_price: Number(value.extra_price || 0),
                value_type: value.value_type || 'unit'
            }))
            .filter((value) => value.name);

        onSubmit({
            name: form.name,
            description: form.description,
            status: form.status,
            values
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-2xl border border-[#c9a14a]/30 bg-[#0a1628] p-6 text-[#f8efe0] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <h2 className="text-2xl font-semibold">{initialValues ? 'Edit Variant Group' : 'Add Variant Group'}</h2>

                <div className="mt-5 space-y-4">
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Group name e.g. Size"
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

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a14a]/80">Values and Price Increase</p>
                            <button type="button" onClick={addValueRow} className="rounded-lg border border-[#c9a14a]/30 px-3 py-1 text-xs font-semibold text-[#f5dfb3]">
                                + Add Row
                            </button>
                        </div>

                        <div className="space-y-3">
                            {form.values.map((valueRow, index) => (
                                <div key={`${index}-${valueRow.name}`} className="grid gap-3 sm:grid-cols-[1fr_140px_120px_auto]">
                                    <input
                                        value={valueRow.name}
                                        onChange={(event) => handleValueChange(index, 'name', event.target.value)}
                                        placeholder="Value name e.g. Large"
                                        className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm focus:border-[#c9a14a]/70 focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={valueRow.extra_price}
                                        onChange={(event) => handleValueChange(index, 'extra_price', event.target.value)}
                                        placeholder="Extra price"
                                        className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm focus:border-[#c9a14a]/70 focus:outline-none"
                                    />
                                    <select
                                        value={valueRow.value_type}
                                        onChange={(event) => handleValueChange(index, 'value_type', event.target.value)}
                                        className="rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black focus:border-[#c9a14a]/70 focus:outline-none"
                                    >
                                        <option value="unit" className="bg-white text-black">Unit</option>
                                        <option value="kg" className="bg-white text-black">Kg</option>
                                        <option value="liter" className="bg-white text-black">Liter</option>
                                    </select>
                                    <button type="button" onClick={() => removeValueRow(index)} className="rounded-lg border border-red-400/40 bg-red-900/30 px-3 py-3 text-xs font-semibold text-red-100">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <p className="mt-3 text-xs text-[#f8efe0]/60">
                            Example: Large can add 500 to the base price of a pizza.
                        </p>
                    </div>

                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black focus:border-[#c9a14a]/70 focus:outline-none"
                    >
                        <option value="active" className="bg-white text-black">Active</option>
                        <option value="inactive" className="bg-white text-black">Inactive</option>
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
                        {submitting ? 'Saving...' : initialValues ? 'Save Group' : 'Create Group'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VariantGroupModal;
