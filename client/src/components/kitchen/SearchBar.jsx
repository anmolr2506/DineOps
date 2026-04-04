import React from 'react';

const SearchBar = React.memo(function SearchBar({ value, onChange }) {
    return (
        <div className="relative w-full">
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search by order ID or item"
                className="w-full rounded-xl border border-[#C9A14A]/30 bg-slate-900/70 px-11 py-3 text-sm text-slate-100 outline-none transition focus:border-[#C9A14A] focus:shadow-[0_0_18px_rgba(201,161,74,0.25)]"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A14A]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
            </span>
        </div>
    );
});

export default SearchBar;
