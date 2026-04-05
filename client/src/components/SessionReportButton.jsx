import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const SessionReportButton = ({ sessionId, className = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        const parsedSessionId = Number(sessionId);
        if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
            setError('Invalid session ID.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await axios.post(`${API_BASE}/session/report/${parsedSessionId}`, {}, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `session-report-${parsedSessionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className={className || 'rounded-xl border border-white/15 bg-[#0a1628]/80 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-[#f8efe0]/85 disabled:opacity-60'}
            >
                {loading ? 'Generating Report...' : 'Generate Report'}
            </button>
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
    );
};

export default SessionReportButton;
