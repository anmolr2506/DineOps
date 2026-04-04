import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

const SessionBadge = () => {
    const navigate = useNavigate();
    const { currentSession, clearSession } = useSession();

    if (!currentSession) {
        return (
            <div className="mb-4 rounded-lg border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No active session selected.
                <Link to="/sessions" className="ml-2 font-semibold underline">
                    Select session
                </Link>
            </div>
        );
    }

    const sessionId = currentSession.id || currentSession.session_id;

    return (
        <div className="mb-6 rounded-xl border border-[#d4b173]/35 bg-[#0a1626]/85 px-5 py-4 text-[#f4ead2] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d4b173]/85">Current Session</p>
                    <h2 className="mt-1 text-lg font-semibold">{currentSession.name || `Session #${sessionId}`}</h2>
                    <p className="mt-1 text-sm text-[#f4ead2]/75">
                        Started: {new Date(currentSession.start_time).toLocaleString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                        {currentSession.status}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            clearSession();
                            navigate('/sessions');
                        }}
                        className="text-sm font-semibold text-[#e5c48d] underline underline-offset-4"
                    >
                        Change Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionBadge;
