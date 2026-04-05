import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const DOCK_WIDTH = 250;
const DOCK_HEIGHT = 84;

const normalizeRole = (role) => {
    const value = String(role || '').trim().toLowerCase();
    if (!value) return 'User';
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
};

const getInitials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const ProfileDock = () => {
    const { user, logout } = useAuth();
    const dragState = useRef({
        dragging: false,
        offsetX: 0,
        offsetY: 0
    });
    const [position, setPosition] = useState(() => {
        try {
            const saved = localStorage.getItem('dineops_floating_logout_position');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) {
                    return { x: parsed.x, y: parsed.y };
                }
            }
        } catch (_) {
            // Ignore invalid cached value.
        }
        return { x: 20, y: Math.max(8, window.innerHeight - (DOCK_HEIGHT + 18)) };
    });

    useEffect(() => {
        if (!user) return;
        localStorage.setItem('dineops_floating_logout_position', JSON.stringify(position));
    }, [position, user]);

    useEffect(() => {
        const handleMove = (event) => {
            if (!dragState.current.dragging) return;

            const nextX = Math.min(
                Math.max(8, event.clientX - dragState.current.offsetX),
                Math.max(8, window.innerWidth - DOCK_WIDTH - 8)
            );
            const nextY = Math.min(
                Math.max(8, event.clientY - dragState.current.offsetY),
                Math.max(8, window.innerHeight - DOCK_HEIGHT - 8)
            );

            setPosition({ x: nextX, y: nextY });
        };

        const handleUp = () => {
            dragState.current.dragging = false;
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, []);

    const handleMouseDown = (event) => {
        if (event.button !== 0) return;
        dragState.current.dragging = true;
        dragState.current.offsetX = event.clientX - position.x;
        dragState.current.offsetY = event.clientY - position.y;
    };

    const displayName = String(user?.name || 'User');
    const displayRole = normalizeRole(user?.role);
    const initials = getInitials(displayName);

    if (!user) return null;

    return (
        <aside
            className="fixed z-50"
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            <div
                onMouseDown={handleMouseDown}
                className="flex w-62.5 cursor-grab items-center justify-between gap-3 rounded-2xl border border-[#C9A14A]/45 bg-slate-950/80 px-3 py-3 shadow-[0_0_22px_rgba(201,161,74,0.22)] backdrop-blur-md"
                title="Drag profile card"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C9A14A]/65 bg-[#0d1d35] text-xs font-bold tracking-[0.08em] text-[#f5dfb3]">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#f8efe0]">{displayName}</p>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#c9a14a]">{displayRole}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={logout}
                    className="shrink-0 rounded-md border border-rose-400/55 bg-rose-500/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-500/25"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default ProfileDock;