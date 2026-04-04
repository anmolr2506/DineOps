const LiveActivity = ({ items = [] }) => {
    return (
        <section className="rounded-2xl border border-white/10 bg-[#0a1628]/85 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
            <h3 className="text-2xl font-semibold text-[#f8efe0]" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Live Activity</h3>
            <div className="mt-4 space-y-4">
                {items.length === 0 ? (
                    <p className="text-sm text-[#f8efe0]/65">No live activity yet.</p>
                ) : (
                    items.map((item) => (
                        <article key={item.id} className="relative border-l border-[#c9a14a]/35 pl-4">
                            <span className="absolute -left-1.25 top-1.5 h-2 w-2 rounded-full bg-[#e7c98b]" />
                            <p className="text-sm font-semibold text-[#f8efe0]">{item.message}</p>
                            <p className="mt-1 text-xs text-[#f8efe0]/55">{new Date(item.created_at).toLocaleString()}</p>
                        </article>
                    ))
                )}
            </div>
        </section>
    );
};

export default LiveActivity;
