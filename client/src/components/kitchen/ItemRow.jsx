import React from 'react';

const ItemRow = React.memo(function ItemRow({ item, onTogglePrepared }) {
    return (
        <button
            type="button"
            onClick={() => onTogglePrepared(item.id, !item.is_prepared)}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-left transition hover:border-[#C9A14A]/60 hover:bg-slate-800/70"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className={`truncate text-sm font-medium ${
                            item.is_prepared ? 'text-slate-500 line-through' : 'text-slate-100'
                        }`}
                    >
                        {item.quantity}x {item.product_name}
                    </p>
                    <p className="truncate text-xs text-slate-400">{item.category_name || 'Uncategorized'}</p>
                </div>
                <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        item.is_prepared
                            ? 'border-emerald-500/50 bg-emerald-600/20 text-emerald-300'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    }`}
                >
                    {item.is_prepared ? 'Prepared' : 'Pending'}
                </span>
            </div>
        </button>
    );
});

export default ItemRow;
