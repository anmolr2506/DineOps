import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const ReceiptButton = ({ orderId, className = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDownload = async () => {
        const parsedOrderId = Number(orderId);
        if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
            setError('Invalid order ID.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await axios.post(`${API_BASE}/generate-receipt/${parsedOrderId}`, {}, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt-order-${parsedOrderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to download receipt.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleDownload}
                disabled={loading}
                className={className || 'rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#f5dfb3] disabled:opacity-60'}
            >
                {loading ? 'Generating...' : 'Download Receipt'}
            </button>
            {error && <p className="mt-2 text-[11px] text-red-300">{error}</p>}
        </div>
    );
};

export default ReceiptButton;
