const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildReceiptHtml = ({ restaurant, order, items, pricing }) => {
    const rows = items.map((item) => `
        <tr>
            <td>
                ${escapeHtml(item.product_name)}
                ${Array.isArray(item.variants) && item.variants.length > 0
        ? `<div style="margin-top:4px;font-size:11px;color:#5f6368;">${item.variants
            .map((variant) => `${escapeHtml(variant.group_name)}: ${escapeHtml(variant.value_name)} (+Rs. ${Number(variant.extra_price || 0).toFixed(2)})`)
            .join(' | ')}</div>`
        : ''}
            </td>
            <td style="text-align:right">${Number(item.quantity || 0)}</td>
            <td style="text-align:right">Rs. ${Number(item.unit_price || 0).toFixed(2)}</td>
            <td style="text-align:right">Rs. ${Number(item.total_price || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt #${escapeHtml(order.id)}</title>
<style>
body { font-family: Arial, sans-serif; color: #111; }
.container { width: 720px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 20px; }
.logo { max-width: 92px; max-height: 92px; }
.section { margin: 16px 0; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
.table th { background: #f5f5f5; }
.totals { width: 280px; margin-left: auto; }
.totals td { padding: 6px 0; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        ${restaurant.logo_url ? `<img class="logo" src="${escapeHtml(restaurant.logo_url)}" alt="logo" />` : ''}
        <h1>${escapeHtml(restaurant.name)}</h1>
        ${restaurant.address ? `<p>${escapeHtml(restaurant.address)}</p>` : ''}
    </div>

    <div class="section">
        <p><strong>Date & Time:</strong> ${escapeHtml(new Date(order.paid_at || order.created_at).toLocaleString())}</p>
        <p><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>
        <p><strong>Table:</strong> ${escapeHtml(order.table_number || order.table_id || '-')}</p>
        <p><strong>Customer:</strong> ${escapeHtml(order.customer_name || '-')}</p>
        <p><strong>Mobile:</strong> ${escapeHtml(order.customer_phone || '-')}</p>
        <p><strong>Payment Method:</strong> ${escapeHtml(order.payment_method || '-')}</p>
        <p><strong>Payment ID:</strong> ${escapeHtml(order.transaction_ref || '-')}</p>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>Product</th>
                <th style="text-align:right">Qty</th>
                <th style="text-align:right">Unit Price</th>
                <th style="text-align:right">Total Price</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>

    <table class="totals">
        <tr><td>Subtotal</td><td style="text-align:right">Rs. ${Number(pricing.subtotal || 0).toFixed(2)}</td></tr>
        <tr><td>Tax (GST ${Number(pricing.gst_percent || 0).toFixed(2)}%)</td><td style="text-align:right">Rs. ${Number(pricing.tax_amount || 0).toFixed(2)}</td></tr>
        <tr><td><strong>Final Total</strong></td><td style="text-align:right"><strong>Rs. ${Number(pricing.final_total || 0).toFixed(2)}</strong></td></tr>
    </table>

    <div class="section" style="text-align:center; margin-top: 20px;">
        <strong>Thank you for visiting</strong>
        ${restaurant.contact_info ? `<p>${escapeHtml(restaurant.contact_info)}</p>` : ''}
    </div>
</div>
</body>
</html>
    `.trim();
};

module.exports = {
    buildReceiptHtml
};
