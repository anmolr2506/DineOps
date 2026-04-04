import { useEffect, useState } from 'react';
import axios from 'axios';
import VariantGroupModal from './VariantGroupModal';

const API_BASE = 'http://localhost:5000/api';

const VariantsTab = ({ canManage }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [valueDrafts, setValueDrafts] = useState({});
    const [valueErrors, setValueErrors] = useState({});

    const fetchGroups = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_BASE}/variants/groups`, {
                params: { search, limit: 100 }
            });
            setGroups(response.data.groups || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to fetch variant groups.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [search]);

    const handleSubmit = async (formValues) => {
        try {
            setSubmitting(true);
            setError('');
            if (editingGroup) {
                await axios.put(`${API_BASE}/variants/groups/${editingGroup.id}`, { ...formValues });
            } else {
                await axios.post(`${API_BASE}/variants/groups`, { ...formValues });
            }
            setShowModal(false);
            setEditingGroup(null);
            await fetchGroups();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to save variant group.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (groupId) => {
        try {
            await axios.delete(`${API_BASE}/variants/groups/${groupId}`, {
                data: {}
            });
            await fetchGroups();
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to delete variant group.');
        }
    };

    const handleAddValue = async (groupId) => {
        const draft = valueDrafts[groupId]?.trim();
        if (!draft) return;

        try {
            setError('');
            await axios.post(`${API_BASE}/variants/groups/${groupId}/values`, {
                name: draft,
                extra_price: 0
            });
            setValueDrafts((current) => ({ ...current, [groupId]: '' }));
            await fetchGroups();
        } catch (err) {
            setValueErrors((current) => ({ ...current, [groupId]: err.response?.data?.error || 'Unable to add value.' }));
        }
    };

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Variants</p>
                        <h2 className="mt-1 text-3xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Variant Groups</h2>
                        <p className="mt-2 text-sm text-[#f8efe0]/70">Create groups like Size or Spice Level, then attach them to categories when building the menu.</p>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-[#1d1204]"
                        >
                            + Add Variant Group
                        </button>
                    )}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search variant groups..."
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40 focus:border-[#c9a14a]/60 focus:outline-none sm:max-w-md"
                    />
                    <p className="text-sm text-[#f8efe0]/60">Showing {groups.length} groups</p>
                </div>
            </div>

            {error && <div className="rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}

            {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[#f8efe0]/75">Loading variant groups...</div>
            ) : groups.length === 0 ? (
                <div className="rounded-xl border border-[#c9a14a]/20 bg-[#0a1628]/70 p-8 text-center">
                    <p className="text-lg font-medium">No variant groups found.</p>
                    <p className="mt-2 text-sm text-[#f8efe0]/70">Create a group like Size with values Small, Medium, Large.</p>
                </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {groups.map((group) => (
                        <article key={group.id} className="rounded-2xl border border-white/10 bg-[#0a1628]/80 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-[#f8efe0]">{group.name}</h3>
                                    <p className="mt-1 text-sm text-[#f8efe0]/70">{group.description || 'No description available.'}</p>
                                    <div className="mt-2 flex gap-3 text-xs text-[#f8efe0]/60">
                                        <span>{group.category_count} categories</span>
                                        <span className="rounded-full border border-[#c9a14a]/25 px-2 py-1 text-[#e7c98b]">{group.status}</span>
                                    </div>
                                </div>

                                {canManage && (
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => { setEditingGroup(group); setShowModal(true); }} className="rounded-md border border-[#c9a14a]/30 px-3 py-2 text-xs font-semibold text-[#f5dfb3]">Edit</button>
                                        <button type="button" onClick={() => handleDelete(group.id)} className="rounded-md border border-red-400/50 bg-red-900/30 px-3 py-2 text-xs font-semibold text-red-100">Delete</button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {(group.values || []).map((value) => (
                                    <span key={value.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#f8efe0]/80">
                                        {value.name} +Rs. {Number(value.extra_price || 0).toFixed(2)}
                                    </span>
                                ))}
                            </div>

                            {canManage && (
                                <div className="mt-4 flex gap-2">
                                    <input
                                        value={valueDrafts[group.id] || ''}
                                        onChange={(event) => setValueDrafts((current) => ({ ...current, [group.id]: event.target.value }))}
                                        placeholder="Add value e.g. Extra Large"
                                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#f8efe0] placeholder:text-[#f8efe0]/40"
                                    />
                                    <button type="button" onClick={() => handleAddValue(group.id)} className="rounded-lg bg-[#c9a14a] px-4 py-2 text-sm font-semibold text-[#201405]">Add</button>
                                </div>
                            )}

                            {valueErrors[group.id] && <p className="mt-2 text-xs text-red-300">{valueErrors[group.id]}</p>}
                        </article>
                    ))}
                </div>
            )}

            <VariantGroupModal
                open={showModal}
                initialValues={editingGroup}
                submitting={submitting}
                onClose={() => {
                    setShowModal(false);
                    setEditingGroup(null);
                }}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default VariantsTab;
