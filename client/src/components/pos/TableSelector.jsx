const TableSelector = ({ tables, selectedTableId, onSelectTable }) => {
    return (
        <section className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Step 2: Select Table</p>
            {tables.length === 0 ? (
                <p className="mt-3 text-sm text-[#f8efe0]/70">Select a floor to view tables.</p>
            ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {tables.map((table) => {
                        const disabled = !table.is_active;
                        return (
                            <button
                                key={table.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => onSelectTable(table.id)}
                                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                    Number(selectedTableId) === Number(table.id)
                                        ? 'border-[#c9a14a]/80 bg-[#c9a14a]/20 text-[#f5dfb3]'
                                        : disabled
                                            ? 'cursor-not-allowed border-white/10 bg-white/5 text-[#f8efe0]/35'
                                            : 'border-white/15 bg-white/5 text-[#f8efe0]/80 hover:border-[#c9a14a]/45'
                                }`}
                            >
                                T-{String(table.table_number).padStart(2, '0')} {disabled ? '(Inactive)' : ''}
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default TableSelector;
