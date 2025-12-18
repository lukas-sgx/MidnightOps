import { pool } from '../config/db';
import { Router } from 'express';

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

        return res.status(200).json({ message: 'Login successful', user: result.rows[0] });
    } catch (err) {
        console.error('Error during login', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;