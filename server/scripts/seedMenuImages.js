const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const pool = require('../config/db');

const execFileAsync = promisify(execFile);

const BASE_DIR = path.join(__dirname, '..', 'generated', 'menu-images');
const CATEGORY_DIR = path.join(BASE_DIR, 'categories');
const PRODUCT_DIR = path.join(BASE_DIR, 'products');
const FALLBACK_PRODUCT_PATH = path.join(PRODUCT_DIR, 'fallback.png');

const toSafeHex = (seed, fallback) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const normalized = Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6);
    return normalized || fallback;
};

const buildPlaceholderUrl = (label, variant) => {
    const bg = toSafeHex(`${variant}:${label}`, '223344');
    const text = 'f8efe0';
    return `https://placehold.co/900x600/png/${bg}/${text}?text=${encodeURIComponent(label)}`;
};

const buildMenuPrompt = ({ name, kind }) => {
    const itemName = String(name || 'restaurant item').trim();
    if (kind === 'category') {
        return [
            `Premium restaurant category banner for ${itemName}.`,
            'Dark moody navy background with warm gold rim light, elegant plated food accents, cinematic composition, premium hospitality branding.',
            'No text, no watermark, no people, no packaging, clean studio food photography, highly detailed, sharp focus.'
        ].join(' ');
    }

    return [
        `Premium food photograph of ${itemName}.`,
        'Moody dark navy restaurant background, warm gold highlights, glossy natural food textures, elegant plating, cinematic studio lighting.',
        'No text, no watermark, no people, no hands, no cutlery clutter, appetizing, realistic, high detail.'
    ].join(' ');
};

const generateImageFromModel = async ({ prompt, targetPath }) => {
    const providerUrl = String(process.env.MENU_IMAGE_PROVIDER_URL || '').trim();
    const apiKey = String(process.env.MENU_IMAGE_API_KEY || '').trim();
    const model = String(process.env.MENU_IMAGE_MODEL || '').trim();

    if (!providerUrl || !apiKey || !model) {
        return false;
    }

    const response = await fetch(providerUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            prompt,
            size: '1024x1024',
            n: 1,
            response_format: 'b64_json'
        })
    });

    if (!response.ok) {
        throw new Error(`Model image generation failed (${response.status}).`);
    }

    const data = await response.json();
    const base64Image = data?.data?.[0]?.b64_json || data?.image_base64 || data?.result?.image_base64;
    const imageUrl = data?.data?.[0]?.url || data?.image_url || data?.result?.image_url;

    if (base64Image) {
        await fs.writeFile(targetPath, Buffer.from(base64Image, 'base64'));
        return true;
    }

    if (imageUrl) {
        await downloadToFile(imageUrl, targetPath);
        return true;
    }

    throw new Error('Model response did not include an image payload.');
};

const downloadToFile = async (url, targetPath) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download image (${response.status}) from ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(targetPath, Buffer.from(arrayBuffer));
};

const generateLocalPng = async ({ label, targetPath, variant }) => {
    const safeLabel = String(label || '').replace(/'/g, "''");
    const safePath = String(targetPath).replace(/'/g, "''");
    const paletteSeed = toSafeHex(`${variant}:${label}`, '223344');
    const r = parseInt(paletteSeed.slice(0, 2), 16);
    const g = parseInt(paletteSeed.slice(2, 4), 16);
    const b = parseInt(paletteSeed.slice(4, 6), 16);

    const psScript = `
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 900, 600
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$bgColor = [System.Drawing.Color]::FromArgb(255, ${r}, ${g}, ${b})
$graphics.Clear($bgColor)
$overlayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(70, 0, 0, 0))
$graphics.FillRectangle($overlayBrush, 0, 430, 900, 170)
$font = New-Object System.Drawing.Font('Segoe UI', 42, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Regular)
$textBrush = [System.Drawing.Brushes]::White
$graphics.DrawString('${safeLabel}', $font, $textBrush, 40, 460)
$graphics.DrawString('DineOps', $subFont, $textBrush, 40, 40)
$bmp.Save('${safePath}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bmp.Dispose()
`;

    await execFileAsync('powershell', ['-NoProfile', '-Command', psScript]);
};

const resolveMenuScopeSessionId = async () => {
    const result = await pool.query(`
        SELECT ps.id
        FROM pos_sessions ps
        LEFT JOIN categories c ON c.session_id = ps.id
        LEFT JOIN products p ON p.session_id = ps.id
        LEFT JOIN variant_groups vg ON vg.session_id = ps.id
        GROUP BY ps.id
        ORDER BY
            (COUNT(DISTINCT c.id) * 5 + COUNT(DISTINCT p.id) * 2 + COUNT(DISTINCT vg.id) * 3) DESC,
            GREATEST(
                COALESCE(MAX(c.created_at), 'epoch'::timestamp),
                COALESCE(MAX(p.created_at), 'epoch'::timestamp),
                COALESCE(MAX(vg.created_at), 'epoch'::timestamp)
            ) DESC,
            ps.id ASC
        LIMIT 1
    `);

    const sessionId = result.rows[0]?.id;
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new Error('No session found for menu image assignment.');
    }

    return sessionId;
};

const ensureDirs = async () => {
    await fs.mkdir(CATEGORY_DIR, { recursive: true });
    await fs.mkdir(PRODUCT_DIR, { recursive: true });
};

const ensureFallbackImage = async () => {
    try {
        await fs.access(FALLBACK_PRODUCT_PATH);
        return;
    } catch (_error) {
        // generate fallback image below
    }

    try {
        await generateLocalPng({
            label: 'DineOps',
            targetPath: FALLBACK_PRODUCT_PATH,
            variant: 'fallback'
        });
    } catch (error) {
        console.warn(`Fallback image generation failed: ${error.message}`);
    }
};

const assignCategoryImages = async (client, sessionId) => {
    const categoriesResult = await client.query(
        'SELECT id, name FROM categories WHERE session_id = $1 ORDER BY id ASC',
        [sessionId]
    );

    let updated = 0;
    for (const category of categoriesResult.rows) {
        const fileName = `category-${category.id}.png`;
        const filePath = path.join(CATEGORY_DIR, fileName);
        const publicUrl = `/generated/menu-images/categories/${fileName}`;
        const imageUrl = buildPlaceholderUrl(category.name || `Category ${category.id}`, 'category');

        try {
            const prompt = buildMenuPrompt({
                name: category.name || `Category ${category.id}`,
                kind: 'category'
            });
            const modelGenerated = await generateImageFromModel({
                prompt,
                targetPath: filePath
            });

            if (!modelGenerated) {
                try {
                    await downloadToFile(imageUrl, filePath);
                } catch (_error) {
                    await generateLocalPng({
                        label: category.name || `Category ${category.id}`,
                        targetPath: filePath,
                        variant: 'category'
                    });
                }
            }

            await client.query('UPDATE categories SET image_url = $1 WHERE id = $2', [publicUrl, category.id]);
            updated += 1;
        } catch (error) {
            console.warn(`Category image failed for ${category.name}: ${error.message}`);
        }
    }

    return { total: categoriesResult.rows.length, updated };
};

const assignProductImages = async (client, sessionId) => {
    const productsResult = await client.query(
        'SELECT id, name FROM products WHERE session_id = $1 ORDER BY id ASC',
        [sessionId]
    );

    let updated = 0;
    for (const product of productsResult.rows) {
        const fileName = `product-${product.id}.png`;
        const filePath = path.join(PRODUCT_DIR, fileName);
        const publicUrl = `/generated/menu-images/products/${fileName}`;
        const imageUrl = buildPlaceholderUrl(product.name || `Product ${product.id}`, 'product');

        try {
            const prompt = buildMenuPrompt({
                name: product.name || `Product ${product.id}`,
                kind: 'product'
            });
            const modelGenerated = await generateImageFromModel({
                prompt,
                targetPath: filePath
            });

            if (!modelGenerated) {
                try {
                    await downloadToFile(imageUrl, filePath);
                } catch (_error) {
                    await generateLocalPng({
                        label: product.name || `Product ${product.id}`,
                        targetPath: filePath,
                        variant: 'product'
                    });
                }
            }

            await client.query('UPDATE products SET image_url = $1 WHERE id = $2', [publicUrl, product.id]);
            updated += 1;
        } catch (error) {
            console.warn(`Product image failed for ${product.name}: ${error.message}`);
        }
    }

    return { total: productsResult.rows.length, updated };
};

const run = async () => {
    await ensureDirs();
    await ensureFallbackImage();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sessionId = await resolveMenuScopeSessionId();

        const categoryStats = await assignCategoryImages(client, sessionId);
        const productStats = await assignProductImages(client, sessionId);

        await client.query('COMMIT');

        console.log(`Session: ${sessionId}`);
        console.log(`Categories updated: ${categoryStats.updated}/${categoryStats.total}`);
        console.log(`Products updated: ${productStats.updated}/${productStats.total}`);
        console.log('Menu images downloaded and assigned successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message || error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
};

run();
