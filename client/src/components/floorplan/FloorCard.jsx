import { useEffect, useState } from 'react';

const FloorCard = ({ floor, isSelected, onSelect, canManage, onDuplicate, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(floor.name || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(floor.name || '');
    }, [floor.name]);

    const handleSave = async () => {
        if (!onUpdate) return;
        try {
            setSaving(true);
            const ok = await onUpdate(floor.id, name);
            if (ok) {
                setIsEditing(false);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className={`rounded-xl border px-4 py-3 transition ${
                isSelected
                    ? 'border-[#c9a14a]/80 bg-[#c9a14a]/18 shadow-[0_10px_25px_rgba(201,161,74,0.2)]'
                    : 'border-white/10 bg-[#0a1628]/65 hover:border-[#c9a14a]/35'
            }`}
        >
            {isEditing ? (
                <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-[#c9a14a]/75">Floor Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#f8efe0] focus:border-[#c9a14a]/60 focus:outline-none"
                        maxLength={100}
                    />
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#1f1201] disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setName(floor.name || '');
                                setIsEditing(false);
                            }}
                            className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#f8efe0]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={onSelect} className="w-full text-left">
                    <p className="text-base font-semibold text-[#f8efe0]">{floor.name}</p>
                    <p className="mt-1 text-xs text-[#f8efe0]/65">{floor.table_count || 0} tables</p>
                </button>
            )}

            {canManage && !isEditing && (
                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded-lg border border-[#c9a14a]/45 bg-[#0d1d35] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#f5dfb3]"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={onDuplicate}
                        className="rounded-lg border border-[#c9a14a]/45 bg-[#0d1d35] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#f5dfb3]"
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded-lg border border-red-400/45 bg-red-900/25 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-100"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default FloorCard;
