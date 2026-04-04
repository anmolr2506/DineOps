const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

async function createTransporter() {
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
    }
    let testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
}

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "Email already exists." });
        }
        const hashed = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            "INSERT INTO users (name, email, password, role, approval_status, is_approved) VALUES ($1, $2, $3, NULL, 'pending', false) RETURNING id, name, email, role, approval_status",
            [name, email, hashed]
        );
        res.status(201).json({ message: "Account created. Waiting for admin approval.", user: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const approvalStatus = user.approval_status || (user.is_approved ? 'approved' : 'pending');

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email, approval_status: approvalStatus }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role, name: user.name, approval_status: approvalStatus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 3600000; // 1 hr

        await pool.query("UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3", [resetToken, tokenExpiry, user.id]);

        const transporter = await createTransporter();
        const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

        let info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"DineOps" <noreply@dineops.com>',
            to: user.email,
            subject: "Password Reset Request",
            html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password. It expires in 1 hour.</p>`
        });

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.json({ message: "Reset link sent to your email." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const result = await pool.query("SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > $2", [token, Date.now()]);

        const user = result.rows[0];
        if (!user) return res.status(400).json({ error: "Invalid or expired token." });

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2", [hashed, user.id]);

        res.json({ message: "Password reset correctly." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, role, COALESCE(approval_status, CASE WHEN is_approved THEN 'approved' ELSE 'pending' END) AS approval_status FROM users WHERE id = $1",
            [req.user.id]
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
