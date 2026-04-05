const CustomerViewportGuard = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#020812] md:flex md:items-center md:justify-center md:px-6 md:py-6">
            <div className="relative w-full md:w-[430px] md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:border-[#C9A14A]/20 md:bg-[#020812] md:shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,74,0.08),transparent_28%),radial-gradient(circle_at_50%_0,rgba(255,255,255,0.05),transparent_18%),linear-gradient(180deg,rgba(2,8,18,0.98),rgba(4,11,22,0.95))]" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
                <div className="relative min-h-screen w-full">{children}</div>
            </div>
        </div>
    );
};

export default CustomerViewportGuard;
