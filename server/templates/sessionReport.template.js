const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildSessionReportHtml = ({ restaurant, session, metrics }) => `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Session Report #${escapeHtml(session.id)}</title>
<style>
body { font-family: Arial, sans-serif; color: #111; }
.container { width: 720px; margin: 0 auto; }
.header { display: flex; align-items: center; gap: 16px; }
.logo { max-width: 72px; max-height: 72px; }
.metrics { margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.card { border: 1px solid #ddd; border-radius: 10px; padding: 10px; }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        ${restaurant.logo_url ? `<img class="logo" src="${escapeHtml(restaurant.logo_url)}" alt="logo" />` : ''}
        <div>
            <h1>${escapeHtml(restaurant.name)}</h1>
            <p>Session #${escapeHtml(session.id)} • ${escapeHtml(new Date().toLocaleDateString())}</p>
        </div>
    </div>

    <div class="metrics">
        <div class="card"><strong>Total Orders</strong><br />${Number(metrics.total_orders || 0)}</div>
        <div class="card"><strong>Total Revenue</strong><br />Rs. ${Number(metrics.total_revenue || 0).toFixed(2)}</div>
        <div class="card"><strong>Active Tables</strong><br />${Number(metrics.active_tables || 0)}</div>
        <div class="card"><strong>Completed Orders</strong><br />${Number(metrics.completed_orders || 0)}</div>
    </div>

    <p style="margin-top: 18px;">Charts are rendered in the PDF output (pie chart for category sales and bar chart for top products).</p>
</div>
</body>
</html>
`.trim();

module.exports = {
    buildSessionReportHtml
};
