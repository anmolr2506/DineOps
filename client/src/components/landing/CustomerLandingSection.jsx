import { useNavigate } from 'react-router-dom';

const accessCards = [
    {
        title: 'Order Food',
        description: 'Browse menu highlights, add items to your cart, and place an order instantly.',
        route: '/customer/order',
        cta: 'Start Order',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
                <path d="M4 6h16l-1.2 6.8a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 4.5H3" />
                <circle cx="10" cy="19" r="1.8" />
                <circle cx="17" cy="19" r="1.8" />
            </svg>
        )
    },
    {
        title: 'Reserve Table',
        description: 'Select your preferred table zone and reserve your dining slot in advance.',
        route: '/customer/reservation',
        cta: 'Reserve Now',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
                <path d="M4 10h16" />
                <path d="M6 10V6a2 2 0 1 1 4 0v4" />
                <path d="M14 10V6a2 2 0 1 1 4 0v4" />
                <path d="M5 10v8" />
                <path d="M19 10v8" />
                <path d="M3 18h18" />
            </svg>
        )
    }
];

const CustomerLandingSection = () => {
    const navigate = useNavigate();

    return (
        <section className="relative overflow-hidden bg-linear-to-br from-[#071127] via-[#0b1a32] to-[#11223d] px-4 py-14 sm:px-8 sm:py-20">
            <div className="pointer-events-none absolute inset-0 opacity-30">
                <div className="absolute -top-20 left-8 h-64 w-64 rounded-full bg-[#c9a14a]/20 blur-3xl" />
                <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-[#1b355f]/60 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-6xl">
                <div className="rounded-3xl border border-[#c9a14a]/25 bg-white/5 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
                    <div className="max-w-2xl">
                        <p className="text-xs uppercase tracking-[0.26em] text-[#c9a14a]/85">Guest Experience</p>
                        <h2 className="mt-3 text-3xl font-semibold text-[#f8efe0] sm:text-4xl" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                            Continue as Customer
                        </h2>
                        <p className="mt-3 text-sm text-[#f8efe0]/72 sm:text-base">
                            No login required. Choose your path and continue with ordering or reservation in a few clicks.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        {accessCards.map((card) => (
                            <button
                                key={card.route}
                                type="button"
                                onClick={() => navigate(card.route)}
                                className="group rounded-2xl border border-[#c9a14a]/30 bg-[#09162b]/80 p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#e6c27d] hover:bg-[#0d1f39] hover:shadow-[0_22px_55px_rgba(201,161,74,0.22)]"
                            >
                                <div className="inline-flex items-center justify-center rounded-xl border border-[#c9a14a]/45 bg-[#c9a14a]/12 p-3 text-[#f1d8a8] transition group-hover:bg-[#c9a14a]/20">
                                    {card.icon}
                                </div>
                                <h3 className="mt-4 text-2xl font-semibold text-[#f8efe0]" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                                    {card.title}
                                </h3>
                                <p className="mt-2 text-sm text-[#f8efe0]/70">{card.description}</p>
                                <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e9c985]">
                                    {card.cta}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                        <path d="M5 12h14" />
                                        <path d="m13 6 6 6-6 6" />
                                    </svg>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CustomerLandingSection;
