import { pool } from '../config/db';
import { Router } from 'express';
import nodemailer from 'nodemailer';
import redisClient from '../config/redis';
import path from 'path';
import rateLimit from 'express-rate-limit';

const router = Router();

const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    handler: (_req, res) => {
        res.status(429).json({
            error: 'Too many requests, please try again later.',
            code: 429,
        });
    },
});

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function send_code(dest: string, code: number) {
    const transporter = nodemailer.createTransport({
        host: "mail.soigneux.works",
        port: 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const info = await transporter.sendMail({
        from: '"MidnightOps Support" <noreply@soigneux.works>',
        to: dest,
        subject: "Your verification code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px; text-align: center;">
                    <img src="cid:logo" alt="MidnightOps Logo" style="width: 60px; height: 60px;" />
                    <h1 style="color: white; margin: 10px 0;">MidnightOps</h1>
                </div>
                <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #1e293b;">Your Verification Code</h2>
                    <p style="color: #475569; font-size: 16px;">Use the following code to complete your login:</p>
                    <div style="background: #0f172a; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 4px;">
                        ${code}
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
                    <p style="color: #64748b; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                </div>
                <div style="background: #1e293b; padding: 15px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2025 MidnightOps. All rights reserved.</p>
                </div>
            </div>
        `,
        attachments: [
            {
                filename: 'logo.png',
                path: path.join(__dirname, '../public/midnightops.png'),
                cid: 'logo'
            }
        ]
    });
}

router.post('/login', apiLimiter, async (req, res) => {
    const { email } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 1) {
            const code = getRandomInt(100000, 999999);
            await send_code(email, code);
            await redisClient.setEx(`login_code_${email}`, 600, code.toString());
        }
        return res.status(200).json({ message: 'If the email exists, a verification code has been sent.' });
    } catch (err) {
        console.error('Error during login', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;