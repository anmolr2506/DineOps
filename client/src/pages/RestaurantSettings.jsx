import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const RestaurantSettings = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        logo_url: '',
        address: '',
        contact_info: '',
        gst_percent: 5
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/restaurant/settings`);
            const config = response.data?.config || {};
            setForm({
                name: config.name || '',
                logo_url: config.logo_url || '',
                address: config.address || '',
                contact_info: config.contact_info || '',
                gst_percent: Number(config.gst_percent || 5)
            });
            setLogoPreview(config.logo_url || '');
            setLogoFile(null);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load restaurant settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const updateField = (name, value) => {
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleLogoChange = (event) => {
        const file = event.target.files?.[0] || null;
        if (!file) {
            setLogoFile(null);
            if (String(logoPreview || '').startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
            setLogoPreview(form.logo_url || '');
            return;
        }

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(String(file.type || '').toLowerCase())) {
            setError('Only PNG and JPEG/JPG files are allowed.');
            event.target.value = '';
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            setError('Logo file must be 3MB or smaller.');
            event.target.value = '';
            return;
        }

        setError('');
        setLogoFile(file);
        if (String(logoPreview || '').startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payload = new FormData();
            payload.append('name', String(form.name || '').trim());
            payload.append('address', String(form.address || '').trim() || '');
            payload.append('contact_info', String(form.contact_info || '').trim() || '');
            payload.append('gst_percent', String(Number(form.gst_percent)));
            payload.append('logo_url', String(form.logo_url || '').trim() || '');

            if (logoFile) {
                payload.append('logo', logoFile);
            }

            const response = await axios.put(`${API_BASE}/restaurant/settings`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const savedConfig = response.data?.config || {};
            if (savedConfig.logo_url) {
                setForm((current) => ({ ...current, logo_url: savedConfig.logo_url }));
                setLogoPreview(savedConfig.logo_url);
            }
            setLogoFile(null);

            setSuccess('Settings saved successfully.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] px-4 py-6 text-[#f8efe0] sm:px-8">
            <main className="mx-auto max-w-7xl">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/80">Admin</p>
                            <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Restaurant Settings</h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">Control branding, receipt identity, and report defaults.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/menu')}
                            className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-2 text-sm font-semibold text-[#f5dfb3] transition hover:bg-[#112443]"
                        >
                            Menu Management
                        </button>
                    </div>
                </header>

                <section className="mt-5 rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/80 p-6">
                    {loading ? (
                        <p className="text-sm text-[#f8efe0]/70">Loading settings...</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid gap-4 lg:max-w-3xl">
                            <label className="grid gap-2 text-sm text-[#f8efe0]/85">
                                Restaurant Name
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) => updateField('name', event.target.value)}
                                    className="rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-black"
                                    required
                                />
                            </label>

                            <label className="grid gap-2 text-sm text-[#f8efe0]/85">
                                Logo Upload (PNG/JPG/JPEG)
                                <input
                                    type="file"
                                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                    onChange={handleLogoChange}
                                    className="rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-black"
                                />
                                <span className="text-xs text-[#f8efe0]/60">Max size: 3MB</span>
                            </label>

                            {logoPreview && (
                                <div className="grid gap-2 text-sm text-[#f8efe0]/85">
                                    <span>Logo Preview</span>
                                    <img
                                        src={logoPreview}
                                        alt="Restaurant logo preview"
                                        className="h-20 w-20 rounded-lg border border-[#c9a14a]/35 bg-white object-contain p-1"
                                    />
                                </div>
                            )}

                            <label className="grid gap-2 text-sm text-[#f8efe0]/85">
                                Address (Optional)
                                <textarea
                                    value={form.address}
                                    onChange={(event) => updateField('address', event.target.value)}
                                    className="min-h-20 rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-black"
                                    placeholder="Restaurant address shown on receipts"
                                />
                            </label>

                            <label className="grid gap-2 text-sm text-[#f8efe0]/85">
                                Contact Info (Optional)
                                <input
                                    type="text"
                                    value={form.contact_info}
                                    onChange={(event) => updateField('contact_info', event.target.value)}
                                    className="rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-black"
                                    placeholder="Phone / email shown in receipt footer"
                                />
                            </label>

                            <label className="grid gap-2 text-sm text-[#f8efe0]/85 lg:max-w-xs">
                                GST %
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={form.gst_percent}
                                    onChange={(event) => updateField('gst_percent', event.target.value)}
                                    className="rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-black"
                                />
                            </label>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-linear-to-r from-[#c9a14a] to-[#e1bf7f] px-5 py-3 text-sm font-semibold text-[#1d1204] disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                                {success && <span className="text-sm text-emerald-300">{success}</span>}
                            </div>

                            {error && <div className="rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
};

export default RestaurantSettings;
