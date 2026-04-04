import { useState } from 'react';

const AddTableModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [tableNumber, setTableNumber] = useState('');
    const [seatsCount, setSeatsCount] = useState('4');
    const [status, setStatus] = useState('active');

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await onSubmit({
            table_number: Number(tableNumber),
            seats_count: Number(seatsCount),
            status
        });
        if (ok) {
            setTableNumber('');
            setSeatsCount('4');
            setStatus('active');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-[#c9a14a]/30 bg-[#0a1628] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">New Table</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#f8efe0]">Add Table</h3>

                <label className="mt-5 block text-sm font-medium text-[#f8efe0]/80">Table Number</label>
                <input
                    type="number"
                    min="1"
                    value={tableNumber}
                    onChange={(event) => setTableNumber(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] focus:border-[#c9a14a]/60 focus:outline-none"
                    required
                />

                <label className="mt-4 block text-sm font-medium text-[#f8efe0]/80">Seats</label>
                <input
                    type="number"
                    min="1"
                    value={seatsCount}
                    onChange={(event) => setSeatsCount(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] focus:border-[#c9a14a]/60 focus:outline-none"
                    required
                />

                <label className="mt-4 block text-sm font-medium text-[#f8efe0]/80">Status</label>
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black"
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-[#f8efe0]">Cancel</button>
                    <button type="submit" disabled={loading} className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-4 py-2 text-sm font-semibold text-[#1f1201] disabled:opacity-60">
                        {loading ? 'Saving...' : 'Create Table'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddTableModal;
