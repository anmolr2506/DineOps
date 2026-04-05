const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { getRestaurantConfig } = require('./restaurantConfig.service');

class PdfServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const normalizePaymentMethod = (method) => {
    const value = String(method || '').toLowerCase();
    if (value === 'upi') return 'UPI';
    if (value === 'card') return 'Card';
    if (value === 'cash') return 'Cash';
    return 'N/A';
};

const fetchImageBuffer = async (url) => {
    const source = String(url || '').trim();
    if (!source) return null;

    const fetchWithRedirects = async (targetUrl, redirectCount = 0) => {
        if (redirectCount > 5) return null;

        let parsed;
        try {
            parsed = new URL(targetUrl);
        } catch (_) {
            return null;
        }

        const client = parsed.protocol === 'https:' ? https : http;

        return await new Promise((resolve) => {
            const request = client.get(targetUrl, {
                headers: {
                    'User-Agent': 'DineOps-PDF/1.0',
                    Accept: 'image/*,*/*;q=0.8'
                }
            }, async (response) => {
                const statusCode = Number(response.statusCode || 0);

                if ([301, 302, 303, 307, 308].includes(statusCode)) {
                    const location = response.headers.location;
                    if (!location) {
                        resolve(null);
                        return;
                    }

                    const redirectedUrl = new URL(location, targetUrl).toString();
                    resolve(await fetchWithRedirects(redirectedUrl, redirectCount + 1));
                    return;
                }

                if (statusCode !== 200) {
                    resolve(null);
                    return;
                }

                const contentType = String(response.headers['content-type'] || '').toLowerCase();
                if (contentType && !contentType.includes('image/')) {
                    resolve(null);
                    return;
                }

                // PDFKit reliably supports PNG/JPEG. Reject unsupported formats early.
                if (contentType.includes('image/svg') || contentType.includes('image/webp')) {
                    resolve(null);
                    return;
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer.length > 0 ? buffer : null);
                });
            });

            request.setTimeout(7000, () => {
                request.destroy();
                resolve(null);
            });

            request.on('error', () => resolve(null));
        });
    };

    try {
        return await fetchWithRedirects(source);
    } catch (_) {
        return null;
    }
};

const buildReceiptData = async (orderId) => {
    const parsedOrderId = Number(orderId);
    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
        throw new PdfServiceError('order_id must be a positive integer.', 400);
    }

    const [restaurantConfig, orderResult] = await Promise.all([
        getRestaurantConfig(),
        pool.query(
            `
            SELECT
                o.id,
                o.table_id,
                t.table_number,
                o.total_amount,
                o.created_at,
                c.name AS customer_name,
                c.phone AS customer_phone,
                pay.id AS payment_id,
                pay.method AS payment_method,
                pay.transaction_ref,
                pay.created_at AS paid_at
            FROM orders o
            LEFT JOIN tables t ON t.id = o.table_id
            LEFT JOIN customers c ON c.id = o.customer_id
            LEFT JOIN LATERAL (
                SELECT id, method, transaction_ref, created_at
                FROM payments
                WHERE order_id = o.id AND status = 'completed'
                ORDER BY created_at DESC
                LIMIT 1
            ) pay ON TRUE
            WHERE o.id = $1
            LIMIT 1
            `,
            [parsedOrderId]
        )
    ]);

    let itemsResult;
    try {
        itemsResult = await pool.query(
            `
            SELECT
                COALESCE(p.name, 'Product #' || oi.product_id::text) AS product_name,
                oi.quantity,
                oi.price AS unit_price,
                oi.subtotal AS total_price,
                COALESCE(oi.tax_percent, p.tax_percent, NULL) AS tax_percent,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'group_name', vg.name,
                                'value_name', vgv.name,
                                'extra_price', vgv.extra_price
                            )
                            ORDER BY vg.name ASC, vgv.name ASC
                        )
                        FROM order_item_variants oiv
                        JOIN variant_group_values vgv ON vgv.id = oiv.variant_value_id
                        JOIN variant_groups vg ON vg.id = vgv.variant_group_id
                        WHERE oiv.order_item_id = oi.id
                    ),
                    '[]'::json
                ) AS variants
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
            `,
            [parsedOrderId]
        );
    } catch (error) {
        if (error.code !== '42P01') {
            throw error;
        }

        itemsResult = await pool.query(
            `
            SELECT
                COALESCE(p.name, 'Product #' || oi.product_id::text) AS product_name,
                oi.quantity,
                oi.price AS unit_price,
                oi.subtotal AS total_price,
                COALESCE(oi.tax_percent, p.tax_percent, NULL) AS tax_percent,
                '[]'::json AS variants
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
            `,
            [parsedOrderId]
        );
    }

    const order = orderResult.rows[0];
    if (!order) {
        throw new PdfServiceError('Order not found.', 404);
    }

    if (!itemsResult.rows.length) {
        throw new PdfServiceError('No order items found for this order.', 404);
    }

    const finalTotal = Number(order.total_amount || 0);
    let subtotal = 0;

    itemsResult.rows.forEach((item) => {
        const unitPrice = Number(item.unit_price || 0);
        const quantity = Number(item.quantity || 0);
        const taxPercent = item.tax_percent !== null && item.tax_percent !== undefined
            ? Number(item.tax_percent)
            : Number(restaurantConfig.gst_percent || 0);

        const preTaxUnit = taxPercent > 0
            ? unitPrice / (1 + (taxPercent / 100))
            : unitPrice;

        subtotal += preTaxUnit * quantity;
    });

    subtotal = Number(subtotal.toFixed(2));
    let taxAmount = Number((finalTotal - subtotal).toFixed(2));

    if (taxAmount < 0) {
        taxAmount = 0;
        subtotal = finalTotal;
    }

    return {
        restaurant: restaurantConfig,
        order,
        items: itemsResult.rows,
        pricing: {
            subtotal,
            tax_amount: taxAmount,
            final_total: finalTotal,
            gst_percent: Number(restaurantConfig.gst_percent || 0)
        }
    };
};

const collectPdfBuffer = (doc) => new Promise((resolve, reject) => {
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
});

const drawCenteredBrandHeader = (doc, {
    logo,
    name,
    address,
    contactInfo,
    subtitleLines = [],
    logoFit = [82, 82],
    topGap = 0
}) => {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;
    const centerX = left + (contentWidth / 2);

    let cursorY = doc.page.margins.top + topGap;

    if (logo) {
        try {
            const logoWidth = logoFit[0];
            const logoHeight = logoFit[1];
            doc.image(logo, centerX - (logoWidth / 2), cursorY, { fit: logoFit, align: 'center' });
            cursorY += logoHeight + 10;
        } catch (_) {
            // Ignore invalid image payload and continue with text-only header.
        }
    }

    doc.font('Helvetica-Bold').fontSize(19);
    const titleHeight = doc.heightOfString(name || 'Restaurant', { width: contentWidth, align: 'center' });
    doc.text(name || 'Restaurant', left, cursorY, { width: contentWidth, align: 'center' });
    cursorY += titleHeight + 4;

    if (address) {
        doc.font('Helvetica').fontSize(10);
        const addressHeight = doc.heightOfString(address, { width: contentWidth, align: 'center' });
        doc.text(address, left, cursorY, { width: contentWidth, align: 'center' });
        cursorY += addressHeight + 3;
    }

    if (contactInfo) {
        doc.font('Helvetica').fontSize(10);
        const contactHeight = doc.heightOfString(contactInfo, { width: contentWidth, align: 'center' });
        doc.text(contactInfo, left, cursorY, { width: contentWidth, align: 'center' });
        cursorY += contactHeight + 3;
    }

    if (Array.isArray(subtitleLines) && subtitleLines.length > 0) {
        doc.font('Helvetica').fontSize(10).fillColor('#4B5563');
        subtitleLines.forEach((line) => {
            const text = String(line || '').trim();
            if (!text) return;
            const lineHeight = doc.heightOfString(text, { width: contentWidth, align: 'center' });
            doc.text(text, left, cursorY, { width: contentWidth, align: 'center' });
            cursorY += lineHeight + 2;
        });
        doc.fillColor('#000000');
    }

    doc.y = cursorY;
    return cursorY;
};

const renderReceiptPdf = async (receiptData) => {
    const { restaurant, order, items, pricing } = receiptData;
    const doc = new PDFDocument({ size: 'A4', margin: 44 });
    const done = collectPdfBuffer(doc);

    const logo = await fetchImageBuffer(restaurant.logo_url);

    drawCenteredBrandHeader(doc, {
        logo,
        name: restaurant.name || 'Restaurant',
        address: restaurant.address,
        contactInfo: restaurant.contact_info,
        logoFit: [92, 92]
    });

    doc.moveDown(0.5);
    doc.strokeColor('#D9D9D9').lineWidth(1).moveTo(44, doc.y).lineTo(551, doc.y).stroke();

    doc.moveDown(0.9);
    doc.fontSize(12).font('Helvetica-Bold').text('Receipt Details');
    doc.moveDown(0.4);

    const infoRows = [
        ['Date & Time', new Date(order.paid_at || order.created_at).toLocaleString()],
        ['Order ID', String(order.id)],
        ['Table', order.table_number ? `T-${String(order.table_number).padStart(2, '0')}` : String(order.table_id || '-')],
        ['Customer', order.customer_name || '-'],
        ['Mobile', order.customer_phone || '-'],
        ['Payment Method', normalizePaymentMethod(order.payment_method)],
        ['Payment ID', order.transaction_ref || '-']
    ];

    infoRows.forEach(([label, value]) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`${label}:`, { continued: true });
        doc.font('Helvetica').text(` ${value}`);
    });

    doc.moveDown(0.7);
    doc.fontSize(12).font('Helvetica-Bold').text('Order Items');
    doc.moveDown(0.3);

    const tableStartX = 44;
    const tableWidth = 507;
    const colX = {
        name: tableStartX + 4,
        qty: tableStartX + 290,
        unit: tableStartX + 350,
        total: tableStartX + 440
    };

    const drawTableHeader = () => {
        doc.rect(tableStartX, doc.y, tableWidth, 22).fillAndStroke('#F6F6F6', '#D8D8D8');
        const y = doc.y + 6;
        doc.fillColor('#111111').fontSize(10).font('Helvetica-Bold');
        doc.text('Product', colX.name, y, { width: 275 });
        doc.text('Qty', colX.qty, y, { width: 45, align: 'right' });
        doc.text('Unit', colX.unit, y, { width: 80, align: 'right' });
        doc.text('Total', colX.total, y, { width: 60, align: 'right' });
        doc.fillColor('#000000');
        doc.y += 22;
    };

    drawTableHeader();

    items.forEach((item) => {
        if (doc.y > 730) {
            doc.addPage();
            drawTableHeader();
        }

        const rowY = doc.y;
        const variants = Array.isArray(item.variants) ? item.variants : [];
        const variantLabel = variants
            .map((variant) => `${variant.group_name}: ${variant.value_name} (+${formatCurrency(variant.extra_price)})`)
            .join(' | ');
        const rowHeight = variantLabel ? 34 : 20;

        doc.rect(tableStartX, rowY, tableWidth, rowHeight).stroke('#ECECEC');
        doc.fontSize(10).font('Helvetica');
        doc.text(item.product_name || '-', colX.name, rowY + 5, { width: 270 });
        if (variantLabel) {
            doc.fontSize(8).fillColor('#4B5563').text(variantLabel, colX.name, rowY + 18, { width: 270, ellipsis: true });
            doc.fillColor('#000000');
        }
        doc.text(String(item.quantity || 0), colX.qty, rowY + 5, { width: 45, align: 'right' });
        doc.text(formatCurrency(item.unit_price), colX.unit, rowY + 5, { width: 80, align: 'right' });
        doc.text(formatCurrency(item.total_price), colX.total, rowY + 5, { width: 60, align: 'right' });
        doc.y = rowY + rowHeight;
    });

    doc.moveDown(1);

    const pricingX = 345;
    const labelWidth = 110;
    const valueWidth = 90;

    doc.font('Helvetica').fontSize(10).text('Subtotal', pricingX, doc.y, { width: labelWidth });
    doc.text(formatCurrency(pricing.subtotal), pricingX + labelWidth, doc.y, { width: valueWidth, align: 'right' });
    doc.moveDown(0.4);

    doc.text(`Tax (GST ${pricing.gst_percent.toFixed(2)}%)`, pricingX, doc.y, { width: labelWidth });
    doc.text(formatCurrency(pricing.tax_amount), pricingX + labelWidth, doc.y, { width: valueWidth, align: 'right' });
    doc.moveDown(0.2);

    doc.moveTo(pricingX, doc.y).lineTo(pricingX + labelWidth + valueWidth, doc.y).stroke('#CFCFCF');
    doc.moveDown(0.2);

    doc.font('Helvetica-Bold').fontSize(11).text('Final Total', pricingX, doc.y, { width: labelWidth });
    doc.text(formatCurrency(pricing.final_total), pricingX + labelWidth, doc.y, { width: valueWidth, align: 'right' });

    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica-Bold').text('Thank you for visiting', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('We look forward to serving you again.', { align: 'center' });

    doc.end();
    return done;
};

const getSessionReportData = async (sessionId) => {
    const parsedSessionId = Number(sessionId);
    if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
        throw new PdfServiceError('session_id must be a positive integer.', 400);
    }

    const [restaurant, sessionRes, metricsRes, categoryRes, topProductsRes, trendRes] = await Promise.all([
        getRestaurantConfig(),
        pool.query(
            `
            SELECT id, name, start_time, end_time, status
            FROM pos_sessions
            WHERE id = $1
            LIMIT 1
            `,
            [parsedSessionId]
        ),
        pool.query(
            `
            SELECT
                COUNT(*)::int AS total_orders,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0)::numeric AS total_revenue,
                COUNT(DISTINCT table_id) FILTER (WHERE status IN ('pending', 'approved', 'preparing'))::int AS active_tables,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders
            FROM orders
            WHERE session_id = $1
            `,
            [parsedSessionId]
        ),
        pool.query(
            `
            SELECT
                COALESCE(c.name, 'Uncategorized') AS category,
                COALESCE(SUM(oi.subtotal), 0)::numeric AS sales
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            LEFT JOIN products p ON p.id = oi.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE o.session_id = $1
              AND o.status = 'paid'
            GROUP BY c.name
            ORDER BY sales DESC
            LIMIT 8
            `,
            [parsedSessionId]
        ),
        pool.query(
            `
            SELECT
                COALESCE(p.name, 'Product #' || oi.product_id::text) AS product_name,
                COALESCE(SUM(oi.quantity), 0)::int AS qty,
                COALESCE(SUM(oi.subtotal), 0)::numeric AS sales
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE o.session_id = $1
              AND o.status = 'paid'
            GROUP BY p.name, oi.product_id
            ORDER BY qty DESC, sales DESC
            LIMIT 8
            `,
            [parsedSessionId]
        ),
        pool.query(
            `
            SELECT
                DATE(created_at) AS date,
                COALESCE(SUM(total_amount), 0)::numeric AS revenue
            FROM orders
            WHERE session_id = $1
              AND status = 'paid'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
            LIMIT 10
            `,
            [parsedSessionId]
        )
    ]);

    const session = sessionRes.rows[0];
    if (!session) {
        throw new PdfServiceError('Session not found.', 404);
    }

    return {
        restaurant,
        session,
        metrics: metricsRes.rows[0] || {
            total_orders: 0,
            total_revenue: 0,
            active_tables: 0,
            completed_orders: 0
        },
        categorySales: categoryRes.rows,
        topProducts: topProductsRes.rows,
        revenueTrend: trendRes.rows
    };
};

const palette = ['#0B4F6C', '#01BAEF', '#20BF55', '#F3A712', '#E4572E', '#8D6FD1', '#2B2D42', '#3A6EA5'];

const drawPieChart = (doc, data, startX, startY, radius) => {
    const total = data.reduce((sum, row) => sum + Number(row.sales || 0), 0);
    if (total <= 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#4B5563').text('No paid category sales to chart.', startX, startY + 45);
        doc.fillColor('#000000');
        return;
    }

    let angle = -Math.PI / 2;

    data.forEach((row, index) => {
        const value = Number(row.sales || 0);
        const segment = (value / total) * Math.PI * 2;

        doc.save();
        doc.fillColor(palette[index % palette.length]);
        doc.moveTo(startX, startY);
        doc.arc(startX, startY, radius, angle, angle + segment);
        doc.lineTo(startX, startY);
        doc.fill();
        doc.restore();

        angle += segment;
    });

    let legendY = startY - radius;
    data.forEach((row, index) => {
        doc.rect(startX + radius + 18, legendY, 10, 10).fill(palette[index % palette.length]);
        doc.fillColor('#111111').fontSize(9).font('Helvetica').text(
            `${row.category}: ${formatCurrency(row.sales)}`,
            startX + radius + 34,
            legendY - 1,
            { width: 180 }
        );
        legendY += 14;
    });

    doc.fillColor('#000000');
};

const drawBarChart = (doc, data, x, y, width, height) => {
    if (!data.length) {
        doc.fontSize(10).font('Helvetica').fillColor('#4B5563').text('No top-selling products available.', x, y + (height / 2));
        doc.fillColor('#000000');
        return;
    }

    const maxValue = Math.max(...data.map((row) => Number(row.qty || 0)), 1);
    const barWidth = Math.min(44, Math.floor((width - 40) / data.length));
    const gap = 12;

    data.forEach((row, index) => {
        const qty = Number(row.qty || 0);
        const barHeight = Math.max(6, Math.round((qty / maxValue) * (height - 34)));
        const barX = x + 16 + (index * (barWidth + gap));
        const barY = y + height - barHeight - 20;

        doc.rect(barX, barY, barWidth, barHeight).fill(palette[index % palette.length]);
        doc.fillColor('#111111').fontSize(8).font('Helvetica').text(String(qty), barX, barY - 10, { width: barWidth, align: 'center' });
        doc.fillColor('#374151').fontSize(7).text(String(row.product_name || '').slice(0, 12), barX - 8, y + height - 16, { width: barWidth + 16, align: 'center' });
    });

    doc.fillColor('#000000');
};

const drawRevenueTrend = (doc, data, x, y, width, height) => {
    if (!data.length) {
        doc.fontSize(10).font('Helvetica').fillColor('#4B5563').text('No revenue trend points available.', x, y + (height / 2));
        doc.fillColor('#000000');
        return;
    }

    const values = data.map((row) => Number(row.revenue || 0));
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    const stepX = data.length > 1 ? width / (data.length - 1) : width;

    doc.save();
    doc.lineWidth(1.5).strokeColor('#0B4F6C');

    data.forEach((row, index) => {
        const revenue = Number(row.revenue || 0);
        const px = x + (index * stepX);
        const py = y + height - (((revenue - minValue) / range) * height);

        if (index === 0) {
            doc.moveTo(px, py);
        } else {
            doc.lineTo(px, py);
        }
    });

    doc.stroke();
    doc.restore();

    data.forEach((row, index) => {
        const revenue = Number(row.revenue || 0);
        const px = x + (index * stepX);
        const py = y + height - (((revenue - minValue) / range) * height);

        doc.circle(px, py, 2.5).fill('#0B4F6C');
        doc.fillColor('#374151').fontSize(7).text(
            new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            px - 16,
            y + height + 4,
            { width: 36, align: 'center' }
        );
    });

    doc.fillColor('#000000');
};

const renderSessionReportPdf = async (reportData) => {
    const { restaurant, session, metrics, categorySales, topProducts, revenueTrend } = reportData;
    const doc = new PDFDocument({ size: 'A4', margin: 42 });
    const done = collectPdfBuffer(doc);

    const logo = await fetchImageBuffer(restaurant.logo_url);

    const headerBottom = drawCenteredBrandHeader(doc, {
        logo,
        name: restaurant.name || 'Restaurant',
        subtitleLines: [
            `Session Report • #${session.id}`,
            `Generated: ${new Date().toLocaleString()}`
        ],
        logoFit: [68, 68],
        topGap: -8
    });

    doc.moveTo(42, headerBottom + 8).lineTo(553, headerBottom + 8).stroke('#DADADA');

    doc.font('Helvetica-Bold').fontSize(12).text('Session Metrics', 42, headerBottom + 22);

    const cards = [
        { label: 'Total Orders', value: Number(metrics.total_orders || 0) },
        { label: 'Total Revenue', value: formatCurrency(metrics.total_revenue) },
        { label: 'Active Tables', value: Number(metrics.active_tables || 0) },
        { label: 'Completed Orders', value: Number(metrics.completed_orders || 0) }
    ];

    cards.forEach((card, index) => {
        const x = 42 + (index * 128);
        const y = headerBottom + 47;
        doc.roundedRect(x, y, 120, 62, 8).fillAndStroke('#F8FAFC', '#E2E8F0');
        doc.fillColor('#64748B').font('Helvetica').fontSize(9).text(card.label, x + 10, y + 10, { width: 100 });
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(14).text(String(card.value), x + 10, y + 28, { width: 100 });
        doc.fillColor('#000000');
    });

    doc.font('Helvetica-Bold').fontSize(12).text('Category-wise Sales Distribution', 42, headerBottom + 132);
    drawPieChart(doc, categorySales, 138, headerBottom + 237, 66);

    doc.font('Helvetica-Bold').fontSize(12).text('Top Selling Products', 42, headerBottom + 332);
    drawBarChart(doc, topProducts, 42, headerBottom + 352, 510, 130);

    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(12).text('Revenue Trend', 42, 42);
    drawRevenueTrend(doc, revenueTrend, 42, 78, 500, 180);

    doc.font('Helvetica').fontSize(10).fillColor('#4B5563').text(
        `Session ${session.id} (${session.name || `Session #${session.id}`}) • Status: ${String(session.status || '').toUpperCase()}`,
        42,
        280
    );
    doc.fillColor('#000000');

    doc.end();
    return done;
};

const generateReceiptPdf = async ({ orderId }) => {
    const data = await buildReceiptData(orderId);
    const buffer = await renderReceiptPdf(data);
    return {
        fileName: `receipt-order-${data.order.id}.pdf`,
        buffer,
        data
    };
};

const generateSessionReportPdf = async ({ sessionId }) => {
    const data = await getSessionReportData(sessionId);
    const buffer = await renderSessionReportPdf(data);
    return {
        fileName: `session-report-${data.session.id}.pdf`,
        buffer,
        data
    };
};

const generateAndStoreReceipt = async ({ orderId }) => {
    const result = await generateReceiptPdf({ orderId });
    const targetDir = path.join(__dirname, '..', 'generated', 'receipts');
    fs.mkdirSync(targetDir, { recursive: true });

    const targetName = `receipt-order-${Number(orderId)}.pdf`;
    const targetPath = path.join(targetDir, targetName);
    fs.writeFileSync(targetPath, result.buffer);

    return {
        fileName: targetName,
        path: targetPath,
        relativeUrl: `/generated/receipts/${targetName}`
    };
};

module.exports = {
    PdfServiceError,
    generateReceiptPdf,
    generateSessionReportPdf,
    generateAndStoreReceipt
};
