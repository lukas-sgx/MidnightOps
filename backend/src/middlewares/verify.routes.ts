import { pool } from '../config/db';
import { Router } from 'express';
import { generateToken } from './jwt';
import redisClient from '../config/redis';
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

router.post('/verify', apiLimiter, async (req, res) => {
    const { email, code } = req.body;

    try {
        const storedCode = await redisClient.get(`login_code_${email}`);
        if (storedCode === code) {
            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 1) {
                const token = generateToken({ userId: result.rows[0].id, email: result.rows[0].email });
                await redisClient.del(`login_code_${email}`);
                await pool.query(
                    'UPDATE users SET last_active = NOW() WHERE email = $1',
                    [email]
                );
                return res.status(200).json({ message: 'Login successful', user: result.rows[0], token: token});
            } else {
                return res.status(400).json({ message: 'Invalid verification code' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
    } catch (err) {
        console.error('Error during code verification', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;