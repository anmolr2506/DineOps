import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCustomerContext } from '../../services/customerOrdering.service';
import CustomerViewportGuard from '../../components/customer/CustomerViewportGuard';

const STORAGE_KEY = 'dineops_customer_ctx';

const CustomerEntry = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [context, setContext] = useState(null);

    const sessionId = searchParams.get('session_id') || '';
    const tableId = searchParams.get('table_id') || '';
    const token = searchParams.get('token') || '';

    const queryString = useMemo(() => {
        const params = new URLSearchParams({
            session_id: String(sessionId),
            table_id: String(tableId),
            token: String(token)
        });
        return params.toString();
    }, [sessionId, tableId, token]);

    useEffect(() => {
        const validate = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await fetchCustomerContext({ sessionId, tableId, token });
                setContext(data);

                const existing = sessionStorage.getItem(STORAGE_KEY);
                const parsed = existing ? JSON.parse(existing) : {};
                if (parsed?.customer_name) {
                    setCustomerName(parsed.customer_name);
                }
            } catch (requestError) {
                setError(requestError.response?.data?.error || 'Invalid QR link. Please scan again.');
            } finally {
                setLoading(false);
            }
        };

        validate();
    }, [sessionId, tableId, token]);

    const startOrdering = () => {
        const trimmed = customerName.trim();
        if (!trimmed) {
            setError('Please enter your name to continue.');
            return;
        }

        const payload = {
            session_id: Number(sessionId),
            table_id: Number(tableId),
            token,
            customer_name: trimmed
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        navigate(`/customer/menu?${queryString}`);
    };

    return (
        <CustomerViewportGuard>
        <div className="min-h-screen px-4 py-6 text-[#f8efe0]">
            <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4">
                <header className="rounded-[1.6rem] border border-[#C9A14A]/18 bg-[rgba(9,15,28,0.86)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                    <p className="font-body text-[0.68rem] uppercase tracking-[0.32em] text-[#C9A14A]">DineOps QR Order</p>
                    <h1 className="font-display mt-3 text-[2.1rem] leading-[0.95] font-semibold text-[#f7eed9]">Welcome</h1>
                    {context?.table?.table_number && (
                        <p className="mt-3 text-sm text-[#f8efe0]/78">Table No: <span className="font-semibold text-[#f2d9a8]">{context.table.table_number}</span></p>
                    )}
                </header>

                <section className="rounded-[1.6rem] border border-white/8 bg-[rgba(9,15,28,0.86)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                    {loading ? (
                        <p className="text-sm text-[#f8efe0]/75">Validating QR details...</p>
                    ) : (
                        <>
                            <label className="font-body text-[0.68rem] uppercase tracking-[0.28em] text-[#C9A14A]">Customer Name</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(event) => {
                                    setCustomerName(event.target.value);
                                    setError('');
                                }}
                                placeholder="Enter your name"
                                className="mt-3 w-full rounded-[1.1rem] border border-white/10 bg-[#09111f] px-4 py-3 text-base text-[#f8efe0] placeholder:text-[#f8efe0]/40 focus:border-[#C9A14A]/70 focus:outline-none"
                            />

                            {error && <p className="mt-3 rounded-[1.1rem] border border-red-400/35 bg-red-900/20 px-3 py-2 text-sm text-red-100">{error}</p>}

                            <button
                                type="button"
                                onClick={startOrdering}
                                disabled={loading || !context}
                                className="mt-5 w-full rounded-[1.1rem] bg-linear-to-r from-[#C9A14A] to-[#d8b15f] px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#1d1204] shadow-[0_14px_28px_rgba(201,161,74,0.2)] disabled:opacity-60"
                            >
                                Start Ordering
                            </button>
                        </>
                    )}
                </section>
            </div>
        </div>
        </CustomerViewportGuard>
    );
};

export default CustomerEntry;
