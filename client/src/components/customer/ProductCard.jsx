const ProductCard = ({ product, onAdd }) => {
    const base = Number(product.price || 0);
    const taxPercent = Number(product.tax_percent || 0);
    const price = base + (base * taxPercent / 100);
    const fallbackImage = '/generated/menu-images/products/fallback.png';

    return (
        <article className="rounded-[1.35rem] border border-[#C9A14A]/18 bg-[rgba(9,15,28,0.9)] p-3 shadow-[0_10px_35px_rgba(0,0,0,0.32)] transition hover:border-[#C9A14A]/45 backdrop-blur-sm">
            <img
                src={product.image_url || fallbackImage}
                alt={product.name}
                onError={(event) => {
                    event.currentTarget.src = fallbackImage;
                }}
                className="h-28 w-full rounded-[1rem] object-cover"
            />
            <h3 className="font-display mt-3 text-[1.05rem] leading-tight font-semibold text-[#f8efe0]">{product.name}</h3>
            <p className="font-body mt-1 text-[0.72rem] leading-5 text-[#f8efe0]/68 line-clamp-2">{product.description || 'Freshly prepared for your table.'}</p>
            <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#f2d9a8]">Rs. {price.toFixed(2)}</p>
                <button
                    type="button"
                    onClick={() => onAdd(product)}
                    className="rounded-full bg-linear-to-r from-[#C9A14A] to-[#d8b15f] px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#1b1306]"
                >
                    Add
                </button>
            </div>
        </article>
    );
};

export default ProductCard;
