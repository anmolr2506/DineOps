import { useState } from 'react';

const AddFloorModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [floorName, setFloorName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await onSubmit(floorName);
        if (ok) {
            setFloorName('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-[#c9a14a]/30 bg-[#0a1628] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">New Floor</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#f8efe0]">Add Floor</h3>

                <label className="mt-5 block text-sm font-medium text-[#f8efe0]/80">Floor Name</label>
                <input
                    type="text"
                    value={floorName}
                    onChange={(event) => setFloorName(event.target.value)}
                    placeholder="e.g. Ground Floor"
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40 focus:border-[#c9a14a]/60 focus:outline-none"
                    maxLength={100}
                    required
                />

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-[#f8efe0]">Cancel</button>
                    <button type="submit" disabled={loading} className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-4 py-2 text-sm font-semibold text-[#1f1201] disabled:opacity-60">
                        {loading ? 'Saving...' : 'Create Floor'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddFloorModal;
