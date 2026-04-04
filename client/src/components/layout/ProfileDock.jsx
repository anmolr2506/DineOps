import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

const ProfileDock = () => {
    const { user, logout } = useAuth();

    const profileName = useMemo(() => String(user?.name || 'User').trim(), [user?.name]);
    const profileRole = useMemo(() => String(user?.role || '').trim(), [user?.role]);

    const initials = useMemo(() => {
        const parts = profileName.split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    }, [profileName]);

    if (!user) return null;

    return (
        <aside className="fixed bottom-4 left-4 z-50 w-65 rounded-2xl border border-[#C9A14A]/35 bg-slate-950/80 p-3 shadow-[0_0_22px_rgba(201,161,74,0.2)] backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A14A]/60 bg-linear-to-br from-[#C9A14A]/50 to-amber-700/60 text-sm font-bold text-slate-950">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{profileName}</p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#C9A14A]">{profileRole || 'guest'}</p>
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg border border-rose-400/50 bg-rose-500/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-500/25"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default ProfileDock;