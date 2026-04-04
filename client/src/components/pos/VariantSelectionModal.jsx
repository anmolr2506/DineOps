import { useEffect, useMemo, useState } from 'react';

const VariantSelectionModal = ({ open, onClose, onConfirm, product, category }) => {
    const variantGroups = category?.variant_groups || [];
    const [selectedValues, setSelectedValues] = useState({});

    useEffect(() => {
        if (!open) {
            setSelectedValues({});
            return;
        }

        const defaultSelections = {};
        variantGroups.forEach((group) => {
            const firstValue = Array.isArray(group.values) && group.values.length > 0 ? group.values[0] : null;
            if (firstValue) {
                defaultSelections[group.id] = firstValue.id;
            }
        });
        setSelectedValues(defaultSelections);
    }, [open, variantGroups]);

    const selectedVariantDetails = useMemo(() => {
        const details = [];
        let extraTotal = 0;

        variantGroups.forEach((group) => {
            const selectedValueId = selectedValues[group.id];
            const selectedValue = (group.values || []).find((value) => value.id === selectedValueId);
            if (selectedValue) {
                const extraPrice = Number(selectedValue.extra_price || 0);
                extraTotal += extraPrice;
                details.push({
                    groupId: group.id,
                    groupName: group.name,
                    valueId: selectedValue.id,
                    valueName: selectedValue.name,
                    extraPrice
                });
            }
        });

        const basePrice = Number(product?.price || 0);
        const subtotal = basePrice + extraTotal;
        const taxPercent = Number(product?.tax_percent || 0);
        const taxAmount = subtotal * (taxPercent / 100);
        const finalUnitPrice = subtotal + taxAmount;

        return {
            details,
            extraTotal,
            taxPercent,
            taxAmount,
            finalUnitPrice
        };
    }, [product?.price, product?.tax_percent, selectedValues, variantGroups]);

    if (!open || !product) return null;

    const handleSubmit = (event) => {
        event.preventDefault();
        onConfirm({
            product,
            category,
            selections: selectedVariantDetails.details,
            extraTotal: selectedVariantDetails.extraTotal,
            finalUnitPrice: selectedVariantDetails.finalUnitPrice
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-2xl border border-[#c9a14a]/30 bg-[#0a1628] p-6 text-[#f8efe0] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Configure Item</p>
                        <h2 className="mt-1 text-2xl font-semibold">{product.name}</h2>
                        <p className="mt-1 text-sm text-[#f8efe0]/70">{category?.name || 'Uncategorized'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-3 py-2 text-sm">
                        Close
                    </button>
                </div>

                <div className="mt-6 space-y-5">
                    {variantGroups.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#f8efe0]/70">
                            This item has no variant groups. It will use the base price.
                        </div>
                    ) : (
                        variantGroups.map((group) => (
                            <section key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#f8efe0]">{group.name}</h3>
                                        <p className="text-xs text-[#f8efe0]/60">Choose one option</p>
                                    </div>
                                    <span className="rounded-full border border-[#c9a14a]/25 px-3 py-1 text-xs font-semibold text-[#e7c98b]">
                                        Required
                                    </span>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {(group.values || []).map((value) => {
                                        const isSelected = selectedValues[group.id] === value.id;
                                        return (
                                            <button
                                                key={value.id}
                                                type="button"
                                                onClick={() => setSelectedValues((current) => ({ ...current, [group.id]: value.id }))}
                                                className={`rounded-lg border px-4 py-3 text-left transition ${
                                                    isSelected
                                                        ? 'border-[#c9a14a]/80 bg-[#c9a14a]/15 text-[#f8efe0]'
                                                        : 'border-white/10 bg-[#0b1a2f] text-[#f8efe0]/80 hover:border-[#c9a14a]/35'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="font-medium">{value.name}</span>
                                                    <span className="text-sm font-semibold text-[#e7c98b]">+Rs. {Number(value.extra_price || 0).toFixed(2)}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        ))
                    )}
                </div>

                <div className="mt-6 rounded-xl border border-[#c9a14a]/25 bg-[#07111f] p-4">
                    <div className="flex items-center justify-between text-sm text-[#f8efe0]/70">
                        <span>Base price</span>
                        <span>Rs. {Number(product.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-[#f8efe0]/70">
                        <span>Variant extras</span>
                        <span>Rs. {selectedVariantDetails.extraTotal.toFixed(2)}</span>
                    </div>
                    {selectedVariantDetails.taxPercent > 0 && (
                        <div className="mt-2 flex items-center justify-between text-sm text-[#f8efe0]/70">
                            <span>Tax ({selectedVariantDetails.taxPercent}%)</span>
                            <span>Rs. {selectedVariantDetails.taxAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-lg font-semibold">
                        <span>Final unit price</span>
                        <span className="text-[#e7c98b]">Rs. {selectedVariantDetails.finalUnitPrice.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-4 py-2 text-sm">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-2 text-sm font-semibold text-[#201405]"
                    >
                        Add to Cart
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VariantSelectionModal;
