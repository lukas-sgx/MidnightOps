import { pool } from '../config/db';
import { Router } from 'express';
import { generateToken } from './jwt';

const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const router = Router();

router.post('/login', async (req, res) => {
    const { email } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = generateToken({ userId: result.rows[0].id, email: result.rows[0].email });
        return res.status(200).json({ message: 'Login successful', user: result.rows[0], token: token});
    } catch (err) {
        console.error('Error during login', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;