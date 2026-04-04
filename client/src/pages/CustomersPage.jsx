import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardSidebar from '../components/layout/DashboardSidebar';

const API_BASE = 'http://localhost:5000/api';

const CustomersPage = () => {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadCustomers = async (value = '') => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_BASE}/customers`, {
                params: value ? { search: value } : {}
            });
            setCustomers(response.data.customers || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch customers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
            <DashboardSidebar />
            <main className="relative z-10 flex-1 p-4 sm:p-8">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Admin</p>
                    <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Customers</h1>
                    <p className="mt-2 text-sm text-[#f8efe0]/70">Search and review customer records by name or phone.</p>
                </header>

                <section className="mt-5 rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-5">
                    <div className="flex gap-3">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name or phone"
                            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#f8efe0]"
                        />
                        <button
                            type="button"
                            onClick={() => loadCustomers(search.trim())}
                            className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-4 py-2 text-sm font-semibold text-[#1d1204]"
                        >
                            Search
                        </button>
                    </div>

                    {error && <div className="mt-4 rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}

                    <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/5 text-[#f5dfb3]">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                                    <th className="px-4 py-3 text-left font-semibold">Phone</th>
                                    <th className="px-4 py-3 text-left font-semibold">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && customers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-[#f8efe0]/70">No customers found.</td>
                                    </tr>
                                )}
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="border-t border-white/10">
                                        <td className="px-4 py-3">{customer.id}</td>
                                        <td className="px-4 py-3">{customer.name}</td>
                                        <td className="px-4 py-3">{customer.phone}</td>
                                        <td className="px-4 py-3">{new Date(customer.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default CustomersPage;
