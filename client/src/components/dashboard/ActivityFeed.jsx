import React from 'react';

const activityTone = (type) => {
    switch ((type || '').toLowerCase()) {
        case 'payment':
            return 'bg-amber-400';
        case 'order':
        case 'kitchen_update':
            return 'bg-sky-400';
        case 'void':
            return 'bg-rose-400';
        default:
            return 'bg-[#c9a86a]';
    }
};

const ActivityFeed = ({ activity = [], loading }) => {
    return (
        <section id="activity" className="rounded-2xl border border-white/10 bg-[#0c1324] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-[#f4ead8]">Live Activity</h3>
                    <p className="mt-1 text-sm text-white/45">Automatically refreshed every 5 seconds</p>
                </div>
                <span className="text-xs uppercase tracking-[0.28em] text-white/35">Feed</span>
            </div>

            <div className="space-y-4">
                {loading && activity.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">Loading activity feed...</div>
                ) : activity.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">No live activity recorded yet.</div>
                ) : activity.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${activityTone(item.type)}`} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-[#f5ecdc]">{item.message}</p>
                            <p className="mt-1 text-xs text-white/40">
                                {item.created_at ? new Date(item.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                }) : 'Just now'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ActivityFeed;
