const FloorSelector = ({ floors, selectedFloorId, onSelectFloor }) => {
    return (
        <section className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Step 1: Select Floor</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {floors.length === 0 && (
                    <p className="text-sm text-[#f8efe0]/70">No floors available.</p>
                )}
                {floors.map((floor) => (
                    <button
                        key={floor.id}
                        type="button"
                        onClick={() => onSelectFloor(floor.id)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                            Number(selectedFloorId) === Number(floor.id)
                                ? 'bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] text-[#1d1204]'
                                : 'border border-white/15 text-[#f8efe0]/70 hover:border-[#c9a14a]/40'
                        }`}
                    >
                        {floor.name}
                    </button>
                ))}
            </div>
        </section>
    );
};

export default FloorSelector;
