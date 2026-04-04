const StatsCard = ({ label, value, hint, accent = false }) => {
    return (
        <article className={`rounded-2xl border p-4 shadow-[0_14px_40px_rgba(0,0,0,0.3)] backdrop-blur ${accent ? 'border-[#c9a14a]/45 bg-[#121f35]/90' : 'border-white/10 bg-[#0a1628]/80'}`}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#c9a14a]/75">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${accent ? 'text-[#e7c98b]' : 'text-[#f8efe0]'}`}>{value}</p>
            {hint && <p className="mt-2 text-xs text-[#f8efe0]/55">{hint}</p>}
        </article>
    );
};

export default StatsCard;
