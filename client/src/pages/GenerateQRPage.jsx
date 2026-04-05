import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const TABLE_COUNT = 5;
const BASE_URL = window.location.origin;

const generateTokens = (count) =>
    Array.from({ length: count }, () => crypto.randomUUID().replace(/-/g, '').slice(0, 12));

const GenerateQRPage = () => {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(() => generateTokens(TABLE_COUNT));
    const qrRefs = useRef([]);

    /* Infinite regeneration — regenerate tokens every 60 seconds */
    useEffect(() => {
        const interval = setInterval(() => {
            setTokens(generateTokens(TABLE_COUNT));
        }, 60_000);
        return () => clearInterval(interval);
    }, []);

    const getQRValue = (tableNum, token) =>
        `${BASE_URL}/customer/scan?table=${tableNum}&token=${token}`;

    const downloadSingleQR = useCallback((tableIndex) => {
        const canvas = qrRefs.current[tableIndex]?.querySelector('canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `Table_${tableIndex + 1}_QR.png`;
        a.click();
    }, []);

    const downloadAllQR = useCallback(() => {
        for (let i = 0; i < TABLE_COUNT; i++) {
            setTimeout(() => downloadSingleQR(i), i * 200);
        }
    }, [downloadSingleQR]);

    return (
        <div className="min-h-screen bg-[#111111] px-4 py-8 text-[#f8efe0] sm:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Title */}
                <h1
                    className="text-2xl font-semibold text-[#e08a3a]"
                    style={{ fontFamily: '"Cormorant Garamond", serif' }}
                >
                    Download QR Codes
                </h1>

                {/* Info Banner */}
                <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5">
                    <p className="text-sm font-semibold text-[#e08a3a]">
                        Auto generate QR based on the table
                    </p>
                    <p className="mt-1 text-xs text-[#ccc]">
                        Each QR has unique token which identify as table
                    </p>
                    <p className="mt-1 text-xs italic text-[#888]">
                        e.g. /aedfjh → table 1, zxcvbn → table 2
                    </p>
                </div>

                {/* QR Grid */}
                <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
                        {tokens.map((token, idx) => {
                            const tableNum = idx + 1;
                            return (
                                <div
                                    key={`${token}-${tableNum}`}
                                    className="flex flex-col items-center"
                                >
                                    <p className="mb-3 text-sm font-semibold text-white">
                                        Table {tableNum}
                                    </p>

                                    <div
                                        ref={(el) => (qrRefs.current[idx] = el)}
                                        className="rounded-lg bg-white p-3"
                                    >
                                        <QRCodeCanvas
                                            value={getQRValue(tableNum, token)}
                                            size={140}
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                            level="M"
                                            includeMargin={false}
                                        />
                                        <p className="mt-2 text-center text-xs font-bold tracking-widest text-black">
                                            SCAN
                                        </p>
                                        <p className="text-center text-xs font-bold tracking-widest text-black">
                                            ME
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => downloadSingleQR(idx)}
                                        className="mt-2 text-xs font-medium text-[#4dabf7] hover:underline"
                                    >
                                        Download
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                    <button
                        type="button"
                        onClick={downloadAllQR}
                        className="rounded-full bg-gradient-to-r from-[#c9a14a] to-[#e1bf7f] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#1d1204] transition hover:shadow-lg hover:shadow-[#c9a14a]/30"
                    >
                        Download All QR Codes
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="rounded-full border border-[#555] bg-[#333] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#444]"
                    >
                        ← Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateQRPage;
