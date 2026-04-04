import { useState } from 'react';

const PendingUserCard = ({ user, onApprove, onReject, processing }) => {
    const [selectedRole, setSelectedRole] = useState('staff');

    return (
        <article className="rounded-xl border border-[#d4b173]/30 bg-[#0b1a2f]/70 p-4 backdrop-blur-md">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-[#f8efe0]">{user.name}</h3>
                    <p className="text-sm text-[#f8efe0]/75">{user.email}</p>
                    <p className="mt-1 text-xs text-[#d4b173]/80">Requested: {new Date(user.created_at).toLocaleString()}</p>
                </div>

                <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[220px]">
                    <label className="text-xs uppercase tracking-[0.2em] text-[#d4b173]/80">Assign Role</label>
                    <select
                        value={selectedRole}
                        onChange={(event) => setSelectedRole(event.target.value)}
                        className="rounded-lg border border-white/15 bg-white px-3 py-2 text-sm text-black"
                    >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="kitchen">Kitchen</option>
                    </select>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onApprove(user.id, selectedRole)}
                    disabled={processing}
                    className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#1f1201] disabled:opacity-60"
                >
                    {processing ? 'Processing...' : 'Approve'}
                </button>
                <button
                    type="button"
                    onClick={() => onReject(user.id)}
                    disabled={processing}
                    className="rounded-lg border border-red-400/45 bg-red-900/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-100 disabled:opacity-60"
                >
                    Reject
                </button>
            </div>
        </article>
    );
};

export default PendingUserCard;
